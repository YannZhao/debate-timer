// Debate Flow Data Structure
const debateFlow = {
    stages: [
        {
            id: 1,
            name: '第一阶段：开篇立论',
            totalDuration: 6 * 60,
            substages: [
                { name: '正方一辩立论', duration: 3 * 60, desc: '正方一辩阐述本方观点，明确立场' },
                { name: '反方一辩立论', duration: 3 * 60, desc: '反方一辩阐述本方观点，明确立场' }
            ]
        },
        {
            id: 2,
            name: '第二阶段：攻辩/申论',
            totalDuration: 8 * 60,
            substages: [
                { name: '正方二辩申论/攻辩', duration: 2 * 60, desc: '补充观点，向反方提问或回应' },
                { name: '反方二辩申论/攻辩', duration: 2 * 60, desc: '补充观点，向正方提问或回应' },
                { name: '正方三辩申论/攻辩', duration: 2 * 60, desc: '补充观点，向反方提问或回应' },
                { name: '反方三辩申论/攻辩', duration: 2 * 60, desc: '补充观点，向正方提问或回应' }
            ]
        },
        {
            id: 3,
            name: '第三阶段：自由辩论',
            totalDuration: 8 * 60,
            isFreeDebate: true,
            substages: [
                { name: '自由辩论', duration: 8 * 60, desc: '双方轮流发言，每方总计4分钟' }
            ]
        },
        {
            id: 4,
            name: '第四阶段：总结陈词',
            totalDuration: 6 * 60,
            substages: [
                { name: '反方四辩总结陈词', duration: 3 * 60, desc: '总结本方观点，指出对方不足' },
                { name: '正方四辩总结陈词', duration: 3 * 60, desc: '总结本方观点，指出对方不足' }
            ]
        },
        {
            id: 5,
            name: '第五阶段：互动环节',
            totalDuration: 4 * 60,
            substages: [
                { name: '观众观点发言 (2名)', duration: 4 * 60, desc: '观众发表看法或提问，每人2分钟' }
            ]
        },
        {
            id: 6,
            name: '第六阶段：观众投票',
            totalDuration: 3 * 60,
            isVoting: true,
            substages: [
                { name: '获胜方投票', duration: 1.5 * 60, desc: '观众扫码投票支持获胜方' },
                { name: '最佳辩手投票', duration: 1.5 * 60, desc: '观众扫码投票选出最佳辩手' }
            ]
        }
    ]
};

// State Management
class DebateTimer {
    constructor() {
        this.currentStageIndex = 0;
        this.currentSubstageIndex = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.currentStageTime = 0;
        this.timerInterval = null;
        
        // Free debate specific
        this.freeDebatePositiveTime = 4 * 60;
        this.freeDebateNegativeTime = 4 * 60;
        this.freeDebateActiveSide = 'positive'; // 'positive' or 'negative'
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateDisplay();
    }

    initializeElements() {
        // Timer displays
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.stageTitle = document.getElementById('stageTitle');
        
        // Timer containers
        this.singleTimerContainer = document.getElementById('singleTimer');
        this.dualTimerContainer = document.getElementById('dualTimer');
        this.votingTimerContainer = document.getElementById('votingTimer');
        
        // Voting elements
        this.votingTimeDisplay = document.getElementById('votingTime');
        this.votingQrCode = document.getElementById('votingQrCode');
        this.votingProgressBar = document.getElementById('votingProgressBar');
        this.votingHint = document.getElementById('votingHint');
        
        // Free debate elements
        this.positiveTimeDisplay = document.getElementById('positiveTime');
        this.negativeTimeDisplay = document.getElementById('negativeTime');
        this.positiveProgress = document.getElementById('positiveProgress');
        this.negativeProgress = document.getElementById('negativeProgress');
        this.freeDebateSwitch = document.getElementById('freeDebateSwitch');
        
        // Progress bar
        this.progressBar = document.getElementById('progressBar');
        
        // Buttons
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.switchSideBtn = document.getElementById('switchSideBtn');
        
        // Progress stages (top progress bar)
        this.progressStages = document.querySelectorAll('.progress-stage');
        
        // Stage details
        this.stageDetailsList = document.getElementById('stageDetailsList');
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.nextBtn.addEventListener('click', () => this.nextSubstage());
        this.switchSideBtn.addEventListener('click', () => this.switchSide());
        
        this.progressStages.forEach((stage, index) => {
            stage.addEventListener('click', () => this.jumpToStage(index));
        });
        
        // Add double-click listeners for time editing
        this.setupTimeEditListeners();
    }

    setupTimeEditListeners() {
        // Single timer
        this.currentTimeDisplay.addEventListener('dblclick', (e) => {
            if (this.isRunning) return; // Don't allow editing while running
            this.editTime(e.target, 'single');
        });
        
        // Voting timer
        this.votingTimeDisplay.addEventListener('dblclick', (e) => {
            if (this.isRunning) return;
            this.editTime(e.target, 'voting');
        });
        
        // Free debate timers
        this.positiveTimeDisplay.addEventListener('dblclick', (e) => {
            if (this.isRunning) return;
            this.editTime(e.target, 'positive');
        });
        
        this.negativeTimeDisplay.addEventListener('dblclick', (e) => {
            if (this.isRunning) return;
            this.editTime(e.target, 'negative');
        });
    }

    editTime(element, type) {
        // Add editing class
        element.classList.add('editing');
        
        // Get current time value
        const currentText = element.textContent.trim();
        
        // Make contenteditable
        element.contentEditable = true;
        element.focus();
        
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Handle blur (when user clicks away)
        const handleBlur = () => {
            element.contentEditable = false;
            element.classList.remove('editing');
            const newText = element.textContent.trim();
            
            // Parse the time (format: MM:SS or -MM:SS)
            const timeMatch = newText.match(/^(-)?(\d+):(\d+)$/);
            if (timeMatch) {
                const isNegative = timeMatch[1] === '-';
                const minutes = parseInt(timeMatch[2]);
                const seconds = parseInt(timeMatch[3]);
                
                if (seconds < 60) {
                    const totalSeconds = (isNegative ? -1 : 1) * (minutes * 60 + seconds);
                    this.applyTimeChange(type, totalSeconds);
                } else {
                    element.textContent = currentText;
                }
            } else {
                element.textContent = currentText;
            }
            
            element.removeEventListener('blur', handleBlur);
            element.removeEventListener('keydown', handleKeydown);
        };
        
        // Handle Enter and Escape keys
        const handleKeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                element.blur();
            } else if (e.key === 'Escape') {
                element.textContent = currentText;
                element.blur();
            }
        };
        
        element.addEventListener('blur', handleBlur);
        element.addEventListener('keydown', handleKeydown);
    }

    applyTimeChange(type, seconds) {
        const currentStage = this.getCurrentStage();
        const currentSubstage = this.getCurrentSubstage();
        
        if (type === 'single') {
            // Update substage duration
            currentSubstage.duration = Math.max(0, seconds);
            this.currentStageTime = 0;
        } else if (type === 'voting') {
            currentSubstage.duration = Math.max(0, seconds);
            this.currentStageTime = 0;
        } else if (type === 'positive') {
            this.freeDebatePositiveTime = Math.max(0, seconds);
        } else if (type === 'negative') {
            this.freeDebateNegativeTime = Math.max(0, seconds);
        }
        
        this.updateDisplay();
    }

    start() {
        if (this.isRunning && !this.isPaused) return;
        
        const currentStage = this.getCurrentStage();
        const currentSubstage = this.getCurrentSubstage();
        
        // Check if time is up
        if (currentStage.isFreeDebate) {
            if (this.freeDebateActiveSide === 'positive' && this.freeDebatePositiveTime <= 0) {
                return; // Don't allow restart if positive side time is up
            }
            if (this.freeDebateActiveSide === 'negative' && this.freeDebateNegativeTime <= 0) {
                return; // Don't allow restart if negative side time is up
            }
        } else {
            if (this.currentStageTime >= currentSubstage.duration) {
                return; // Don't allow restart if time is up
            }
        }
        
        this.isRunning = true;
        this.isPaused = false;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        
        this.timerInterval = setInterval(() => this.tick(), 1000);
    }

    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        clearInterval(this.timerInterval);
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentStageTime = 0;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        clearInterval(this.timerInterval);
        
        if (this.getCurrentStage().isFreeDebate) {
            const duration = this.getCurrentSubstage().duration;
            this.freeDebatePositiveTime = duration / 2;
            this.freeDebateNegativeTime = duration / 2;
            this.freeDebateActiveSide = 'positive';
        }
        
        this.updateDisplay();
        this.updateButtonStates();
    }

    tick() {
        const currentStage = this.getCurrentStage();
        const currentSubstage = this.getCurrentSubstage();
        
        // Check if time is already up before incrementing
        if (currentStage.isFreeDebate) {
            if (this.freeDebateActiveSide === 'positive' && this.freeDebatePositiveTime <= 0) {
                this.pause();
                return;
            }
            if (this.freeDebateActiveSide === 'negative' && this.freeDebateNegativeTime <= 0) {
                this.pause();
                return;
            }
        } else {
            if (this.currentStageTime >= currentSubstage.duration) {
                this.pause();
                return;
            }
        }
        
        this.currentStageTime++;
        
        if (currentStage.isFreeDebate) {
            // Free debate timing
            if (this.freeDebateActiveSide === 'positive') {
                this.freeDebatePositiveTime--;
                if (this.freeDebatePositiveTime <= 0) {
                    this.freeDebatePositiveTime = 0;
                    this.pause();
                    this.playAlert();
                }
            } else {
                this.freeDebateNegativeTime--;
                if (this.freeDebateNegativeTime <= 0) {
                    this.freeDebateNegativeTime = 0;
                    this.pause();
                    this.playAlert();
                }
            }
        } else {
            // Normal timing
            if (this.currentStageTime >= currentSubstage.duration) {
                this.pause();
                this.playAlert();
            }
        }
        
        this.updateDisplay();
    }

    switchSide() {
        if (!this.getCurrentStage().isFreeDebate) return;
        
        this.freeDebateActiveSide = this.freeDebateActiveSide === 'positive' ? 'negative' : 'positive';
        this.updateDisplay();
    }

    nextSubstage() {
        const currentStage = this.getCurrentStage();
        
        if (this.currentSubstageIndex < currentStage.substages.length - 1) {
            this.currentSubstageIndex++;
        } else if (this.currentStageIndex < debateFlow.stages.length - 1) {
            this.currentStageIndex++;
            this.currentSubstageIndex = 0;
        } else {
            alert('辩论赛已结束！');
            return;
        }
        
        this.reset();
    }

    jumpToStage(stageIndex) {
        if (this.isRunning && !confirm('计时正在进行中，确定要跳转阶段吗？')) {
            return;
        }
        
        this.currentStageIndex = stageIndex;
        this.currentSubstageIndex = 0;
        this.reset();
        this.updateDisplay();
    }

    getCurrentStage() {
        return debateFlow.stages[this.currentStageIndex];
    }

    getCurrentSubstage() {
        return this.getCurrentStage().substages[this.currentSubstageIndex];
    }

    formatTime(seconds) {
        const mins = Math.floor(Math.abs(seconds) / 60);
        const secs = Math.abs(seconds) % 60;
        const sign = seconds < 0 ? '-' : '';
        return `${sign}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    updateDisplay() {
        const currentStage = this.getCurrentStage();
        const currentSubstage = this.getCurrentSubstage();
        
        // Update stage title in right panel
        this.stageTitle.textContent = currentStage.name;
        
        // Update progress stages (top progress bar)
        this.progressStages.forEach((stage, index) => {
            stage.classList.remove('active', 'completed');
            if (index === this.currentStageIndex) {
                stage.classList.add('active');
            } else if (index < this.currentStageIndex) {
                stage.classList.add('completed');
            }
        });
        
        // Update timer display
        if (currentStage.isVoting) {
            // Voting stage
            this.singleTimerContainer.style.display = 'none';
            this.dualTimerContainer.style.display = 'none';
            this.votingTimerContainer.style.display = 'block';
            this.freeDebateSwitch.style.display = 'none';
            
            // Update QR code based on substage
            if (this.currentSubstageIndex === 0) {
                this.votingQrCode.src = 'winer_voting.png';
                this.votingQrCode.alt = '获胜方投票二维码';
            } else {
                this.votingQrCode.src = 'best_debater.png';
                this.votingQrCode.alt = '最佳辩手投票二维码';
            }
            
            const remainingTime = Math.max(0, currentSubstage.duration - this.currentStageTime);
            this.votingTimeDisplay.textContent = this.formatTime(remainingTime);
            
            // Check if voting time is up and blur QR code
            if (remainingTime <= 0) {
                this.votingQrCode.classList.add('expired');
                this.votingHint.textContent = '投票已结束';
            } else {
                this.votingQrCode.classList.remove('expired');
                this.votingHint.textContent = '';
            }
            
            // Update progress bar
            const progress = (this.currentStageTime / currentSubstage.duration) * 100;
            this.votingProgressBar.style.width = `${Math.min(progress, 100)}%`;
            
            // Warning colors
            this.updateWarningColors(this.votingTimerContainer, remainingTime, currentSubstage.duration);
        } else if (currentStage.isFreeDebate) {
            // Free debate stage
            this.singleTimerContainer.style.display = 'none';
            this.dualTimerContainer.style.display = 'block';
            this.votingTimerContainer.style.display = 'none';
            this.freeDebateSwitch.style.display = 'block';
            
            this.positiveTimeDisplay.textContent = this.formatTime(this.freeDebatePositiveTime);
            this.negativeTimeDisplay.textContent = this.formatTime(this.freeDebateNegativeTime);
            
            // Update progress bars
            const totalTime = currentSubstage.duration / 2;
            const positivePercent = (this.freeDebatePositiveTime / totalTime) * 100;
            const negativePercent = (this.freeDebateNegativeTime / totalTime) * 100;
            
            this.positiveProgress.style.width = `${positivePercent}%`;
            this.negativeProgress.style.width = `${negativePercent}%`;
            
            // Highlight active side
            const positiveTimer = document.querySelector('.positive-side');
            const negativeTimer = document.querySelector('.negative-side');
            
            positiveTimer.classList.toggle('active', this.freeDebateActiveSide === 'positive');
            negativeTimer.classList.toggle('active', this.freeDebateActiveSide === 'negative');
            
            // Warning colors
            this.updateWarningColors(positiveTimer, this.freeDebatePositiveTime, totalTime);
            this.updateWarningColors(negativeTimer, this.freeDebateNegativeTime, totalTime);
        } else {
            // Regular stages
            this.singleTimerContainer.style.display = 'block';
            this.dualTimerContainer.style.display = 'none';
            this.votingTimerContainer.style.display = 'none';
            this.freeDebateSwitch.style.display = 'none';
            
            const remainingTime = Math.max(0, currentSubstage.duration - this.currentStageTime);
            this.currentTimeDisplay.textContent = this.formatTime(remainingTime);
            
            // Update progress bar
            const progress = (this.currentStageTime / currentSubstage.duration) * 100;
            this.progressBar.style.width = `${Math.min(progress, 100)}%`;
            
            // Warning colors
            this.updateWarningColors(this.singleTimerContainer, remainingTime, currentSubstage.duration);
        }
        
        // Update stage details
        this.updateStageDetails();
        
        // Update button states based on time remaining
        this.updateButtonStates();
    }

    updateButtonStates() {
        const currentStage = this.getCurrentStage();
        const currentSubstage = this.getCurrentSubstage();
        
        // Check if time is up
        let timeIsUp = false;
        
        if (currentStage.isFreeDebate) {
            if (this.freeDebateActiveSide === 'positive') {
                timeIsUp = this.freeDebatePositiveTime <= 0;
            } else {
                timeIsUp = this.freeDebateNegativeTime <= 0;
            }
        } else {
            timeIsUp = this.currentStageTime >= currentSubstage.duration;
        }
        
        // Disable start button if time is up and not running
        if (timeIsUp && !this.isRunning) {
            this.startBtn.disabled = true;
        } else if (!this.isRunning) {
            this.startBtn.disabled = false;
        }
    }

    updateWarningColors(element, remainingTime, totalTime) {
        element.classList.remove('time-warning', 'time-danger');
        
        const percentage = (remainingTime / totalTime) * 100;
        
        if (percentage <= 10 && percentage > 0) {
            element.classList.add('time-danger');
        } else if (percentage <= 25) {
            element.classList.add('time-warning');
        }
    }

    updateStageDetails() {
        const currentStage = this.getCurrentStage();
        this.stageDetailsList.innerHTML = '';
        
        currentStage.substages.forEach((substage, index) => {
            const item = document.createElement('div');
            item.className = 'detail-item';
            
            if (index < this.currentSubstageIndex) {
                item.classList.add('completed');
            } else if (index === this.currentSubstageIndex) {
                item.classList.add('active');
            }
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'detail-content';
            
            const name = document.createElement('div');
            name.className = 'detail-name';
            name.textContent = substage.name;
            
            const desc = document.createElement('div');
            desc.className = 'detail-desc';
            desc.textContent = substage.desc;
            
            contentDiv.appendChild(name);
            contentDiv.appendChild(desc);
            
            const duration = document.createElement('span');
            duration.className = 'detail-duration';
            duration.textContent = this.formatTime(substage.duration);
            duration.title = '双击可编辑时长';
            duration.style.cursor = 'pointer';
            
            // Add double-click listener for duration editing
            duration.addEventListener('dblclick', (e) => {
                if (this.isRunning) return;
                this.editSubstageDuration(e.target, substage);
            });
            
            item.appendChild(contentDiv);
            item.appendChild(duration);
            this.stageDetailsList.appendChild(item);
        });
    }

    editSubstageDuration(element, substage) {
        const currentText = element.textContent.trim();
        
        element.contentEditable = true;
        element.focus();
        element.style.outline = '2px solid var(--secondary-color)';
        element.style.outlineOffset = '2px';
        element.style.borderRadius = '4px';
        element.style.padding = '2px 4px';
        element.style.background = 'rgba(52, 152, 219, 0.05)';
        
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        const handleBlur = () => {
            element.contentEditable = false;
            element.style.outline = '';
            element.style.outlineOffset = '';
            element.style.borderRadius = '';
            element.style.padding = '';
            element.style.background = '';
            
            const newText = element.textContent.trim();
            const timeMatch = newText.match(/^(-)?(\d+):(\d+)$/);
            
            if (timeMatch) {
                const isNegative = timeMatch[1] === '-';
                const minutes = parseInt(timeMatch[2]);
                const seconds = parseInt(timeMatch[3]);
                
                if (seconds < 60) {
                    const totalSeconds = (isNegative ? -1 : 1) * (minutes * 60 + seconds);
                    substage.duration = Math.max(0, totalSeconds);
                    element.textContent = this.formatTime(substage.duration);
                } else {
                    element.textContent = currentText;
                }
            } else {
                element.textContent = currentText;
            }
            
            element.removeEventListener('blur', handleBlur);
            element.removeEventListener('keydown', handleKeydown);
        };
        
        const handleKeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                element.blur();
            } else if (e.key === 'Escape') {
                element.textContent = currentText;
                element.blur();
            }
        };
        
        element.addEventListener('blur', handleBlur);
        element.addEventListener('keydown', handleKeydown);
    }

    playAlert() {
        // Play audio alert if available
        // For now, just use system beep
        if (typeof Audio !== 'undefined') {
            // You can add an audio file here
            // const audio = new Audio('alert.mp3');
            // audio.play();
        }
    }
}

// Initialize the application
let debateTimer;

document.addEventListener('DOMContentLoaded', () => {
    debateTimer = new DebateTimer();
});
