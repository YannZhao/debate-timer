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
            name: '第六阶段：评委点评',
            totalDuration: 6 * 60,
            substages: [
                { name: '评委点评', duration: 5 * 60, desc: '评委专业点评，指出优缺点' },
                { name: '结果公布', duration: 1 * 60, desc: '公布获胜方和最佳辩手' }
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
        this.totalElapsedTime = 0;
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
        this.totalTimeDisplay = document.getElementById('totalTime');
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.stageNameDisplay = document.getElementById('stageName');
        this.stageName2Display = document.getElementById('stageName2');
        this.substageNameDisplay = document.getElementById('substageName');
        this.stageTitle = document.getElementById('stageTitle');
        
        // Timer containers
        this.singleTimerContainer = document.getElementById('singleTimer');
        this.dualTimerContainer = document.getElementById('dualTimer');
        
        // Free debate elements
        this.positiveTimeDisplay = document.getElementById('positiveTime');
        this.negativeTimeDisplay = document.getElementById('negativeTime');
        this.positiveProgress = document.getElementById('positiveProgress');
        this.negativeProgress = document.getElementById('negativeProgress');
        this.freeDebateControls = document.getElementById('freeDebateControls');
        
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
    }

    start() {
        if (this.isRunning && !this.isPaused) return;
        
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
    }

    tick() {
        this.totalElapsedTime++;
        this.currentStageTime++;
        
        const currentStage = this.getCurrentStage();
        const currentSubstage = this.getCurrentSubstage();
        
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
        this.updateDisplay();
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
        
        // Update total time
        this.totalTimeDisplay.textContent = this.formatTime(this.totalElapsedTime);
        
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
        if (currentStage.isFreeDebate) {
            this.singleTimerContainer.style.display = 'none';
            this.dualTimerContainer.style.display = 'block';
            
            // Update stage name for dual timer
            this.stageName2Display.textContent = currentStage.name;
            
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
            this.singleTimerContainer.style.display = 'block';
            this.dualTimerContainer.style.display = 'none';
            
            // Update stage and substage names
            this.stageNameDisplay.textContent = currentStage.name;
            this.substageNameDisplay.textContent = currentSubstage.name;
            
            const remainingTime = currentSubstage.duration - this.currentStageTime;
            this.currentTimeDisplay.textContent = this.formatTime(remainingTime);
            
            // Update progress bar
            const progress = (this.currentStageTime / currentSubstage.duration) * 100;
            this.progressBar.style.width = `${Math.min(progress, 100)}%`;
            
            // Warning colors
            this.updateWarningColors(this.singleTimerContainer, remainingTime, currentSubstage.duration);
        }
        
        // Update stage details
        this.updateStageDetails();
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
            
            item.appendChild(contentDiv);
            item.appendChild(duration);
            this.stageDetailsList.appendChild(item);
        });
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
