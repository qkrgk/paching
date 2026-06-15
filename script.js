// 글로벌 자산 변수
let myPoints = 50000;
let jackpot = 10000;
let myDebt = 0;

// 상태 변수
let isCreditBanned = false; 
let isVoluntaryMining = false; 
let loanTimer = null;
let timeLeft = 0;

// 게임 기본 데이터 세팅
let selectedToolCost = 100;
const symbols = ['🍒', '🍋', '🍇', '🔔', '💎', '7'];
let selectedHorseIdx = 0; 
const horses = [
    { name: "번개질주", prob: 0.40, dividend: 1.8 },
    { name: "황금마차", prob: 0.25, dividend: 2.5 },
    { name: "자본주의", prob: 0.18, dividend: 4.0 },
    { name: "소화불량", prob: 0.12, dividend: 6.5 },
    { name: "인생역전", prob: 0.05, dividend: 15.0 }
];

// 스크래처 복권 변수 데이터
let scratchWinningNums = [];
let scratchPlayerNums = [];
let scratchedCount = 0;
let hasTicket = false;

// 광산 과열 시스템 변수
let mineFatigue = 0;
let cooldownTimer = null;

// DOM 캐싱
const jackpotDisplay = document.getElementById('jackpot-display');
const myPointsDisplay = document.getElementById('my-points-display');
const debtDisplay = document.getElementById('debt-display');
const loanTimerDisplay = document.getElementById('loan-timer-display');

const betInput = document.getElementById('bet-input');
const slotProbDisplay = document.getElementById('slot-prob-display');
const slotButton = document.getElementById('slot-button');
const slotMessage = document.getElementById('slot-message');
const mineButton = document.getElementById('mine-button');
const miningMessage = document.getElementById('mining-message');
const raceBetInput = document.getElementById('race-bet-input');
const raceButton = document.getElementById('race-button');
const raceMessage = document.getElementById('race-message');
const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];

// ================= [몰래 심어둔 히든 시스템 수호] =================
window.addEventListener('keyup', function(e) {
    if (e.key === 'i' || e.key === 'I') {
        myPoints += 100000;
        updateUI();
    }
});

// ================= [페이지 이동 및 통제 시스템] =================
function switchPage(pageId) {
    if (isCreditBanned) {
        alert("🚨 당신은 신용불량 상태입니다! 광산에서 빚을 모두 갚기 전까진 나갈 수 없습니다!");
        pageId = 'slave';
    }

    document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

    document.getElementById(`page-${pageId}`).style.display = 'block';
    
    const tabs = { 'slot':0, 'mine':1, 'race':2, 'scratch':3, 'bank':4, 'slave':5 };
    document.querySelectorAll('.nav-tab')[tabs[pageId]].classList.add('active');

    if (pageId === 'slave' && !isCreditBanned) {
        isVoluntaryMining = true;
        document.getElementById('slave-notice').innerText = "현재 상태: 자진 입산 체험 중";
        document.getElementById('escape-mine-btn').style.display = "block";
    } else if (pageId !== 'slave') {
        isVoluntaryMining = false;
    }
}

function updateUI() {
    jackpotDisplay.innerText = jackpot.toLocaleString();
    myPointsDisplay.innerText = myPoints.toLocaleString();
    debtDisplay.innerText = myDebt.toLocaleString();
    updateSlotProbability();

    if (isCreditBanned) {
        document.getElementById('slave-notice').innerText = "🚨 현재 상태: 신용불량 강제 노역 중!!";
        document.getElementById('escape-mine-btn').style.display = "none";
        document.getElementById('loan-btn').disabled = true;
    } else {
        document.getElementById('loan-btn').disabled = false;
    }
}

// ================= [스크래처 복권 로직] =================
function initScratchUI() {
    const container = document.getElementById('scratch-grid-container');
    container.innerHTML = '';
    for(let i=0; i<6; i++) {
        const cell = document.createElement('div');
        cell.className = 'scratch-cell';
        cell.innerHTML = `
            <div class="scratch-number" id="scr-num-${i}">?</div>
            <div class="scratch-overlay" id="scr-overlay-${i}" onclick="scratchCard(${i})">긁기 (CLICK)</div>
        `;
        container.appendChild(cell);
    }
}

function buyScratchTicket() {
    if (myPoints < 1000) return alert("복권 구매 비용(1,000P)이 부족합니다.");
    if (hasTicket && scratchedCount < 6) return alert("이미 구매한 복권이 있습니다. 먼저 6개의 칸을 모두 확인하세요!");

    myPoints -= 1000;
    hasTicket = true;
    scratchedCount = 0;
    document.getElementById('scratch-buy-btn').disabled = true;
    document.getElementById('scratch-message').innerHTML = "복권을 구매했습니다! 6개의 은색 칸을 모두 클릭해 오픈하세요.";

    scratchWinningNums = [];
    while(scratchWinningNums.length < 6) {
        let r = Math.floor(Math.random() * 45) + 1;
        if(!scratchWinningNums.includes(r)) scratchWinningNums.push(r);
    }
    scratchWinningNums.sort((a,b)=>a-b);

    const ballContainer = document.getElementById('winning-balls-container');
    ballContainer.innerHTML = '';
    scratchWinningNums.forEach(num => {
        ballContainer.innerHTML += `<span class="number-ball" id="win-ball-${num}">${num}</span>`;
    });

    scratchPlayerNums = [];
    let guaranteedNum = scratchWinningNums[Math.floor(Math.random() * scratchWinningNums.length)];
    scratchPlayerNums.push(guaranteedNum);

    while(scratchPlayerNums.length < 6) {
        let r = Math.floor(Math.random() * 45) + 1;
        if(!scratchPlayerNums.includes(r)) scratchPlayerNums.push(r);
    }

    scratchPlayerNums.sort(() => Math.random() - 0.5);

    initScratchUI();
    for(let i=0; i<6; i++) {
        const numDiv = document.getElementById(`scr-num-${i}`);
        numDiv.innerText = scratchPlayerNums[i];
    }

    updateUI();
}

function scratchCard(index) {
    if (!hasTicket) return alert("먼저 새 복권을 구매해 주세요!");
    
    const overlay = document.getElementById(`scr-overlay-${index}`);
    if (overlay.classList.contains('scratched')) return;

    overlay.classList.add('scratched');
    scratchedCount++;

    const currentNum = scratchPlayerNums[index];
    const numDiv = document.getElementById(`scr-num-${index}`);

    if (scratchWinningNums.includes(currentNum)) {
        numDiv.classList.add('match');
        const winBall = document.getElementById(`win-ball-${currentNum}`);
        if (winBall) winBall.classList.add('match');
    }

    if (scratchedCount === 6) {
        calculateScratchResult();
    }
}

function calculateScratchResult() {
    hasTicket = false;
    document.getElementById('scratch-buy-btn').disabled = false;

    let matchCount = scratchPlayerNums.filter(num => scratchWinningNums.includes(num)).length;
    let reward = 0;

    if (matchCount === 3) reward = 2000;
    else if (matchCount === 4) reward = 5000;
    else if (matchCount === 5) reward = 500000;
    else if (matchCount === 6) reward = 900000;

    if (reward > 0) {
        myPoints += reward;
        document.getElementById('scratch-message').innerHTML = `<span class="success">🎉 당첨 소식! 총 ${matchCount}개 일치!\n상금으로 ${reward.toLocaleString()} P를 획득했습니다!</span>`;
    } else {
        document.getElementById('scratch-message').innerHTML = `<span class="fail">꽝! 아쉽게도 ${matchCount}개 일치에 그쳤습니다.\n(보정 효과로 1개 이상 무조건 적중! 3개부터 당첨입니다)</span>`;
    }
    updateUI();
}

// ================= [사채 은행 & 지옥 광산 로직] =================
function takeLoan() {
    if (isCreditBanned) return alert("신용불량자는 대출을 받을 수 없습니다.");
    if (myDebt > 0) return alert("이미 갚지 않은 대출이 존재합니다.");

    const amount = parseInt(document.getElementById('loan-amount-input').value);
    if (isNaN(amount) || amount < 100 || amount > 10000) {
        return alert("대출 금액은 100P에서 10,000P 사이만 가능합니다.");
    }

    myDebt = Math.floor(amount * 1.1);
    myPoints += amount;
    document.getElementById('bank-message').innerHTML = `<span class="success">💰 사채 대출 성공!\n이자가 포함된 ${myDebt.toLocaleString()}P를 1분 안에 갚으세요.</span>`;
    
    timeLeft = 60;
    loanTimerDisplay.innerText = `⏱️ 상환 기한: ${timeLeft}초`;
    
    clearInterval(loanTimer);
    loanTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            loanTimerDisplay.innerText = `⏱️ 상환 기한: ${timeLeft}초`;
        } else {
            clearInterval(loanTimer);
            loanTimerDisplay.innerText = "";
            autoExecuteDebt(); 
        }
    }, 1000);

    updateUI();
}

function repayLoan() {
    if (myDebt <= 0) return alert("갚아야 할 부채가 없습니다.");
    if (myPoints < myDebt) return alert("보유 포인트가 대출금보다 부족합니다!");

    myPoints -= myDebt;
    myDebt = 0;
    clearInterval(loanTimer);
    loanTimerDisplay.innerText = "";
    document.getElementById('bank-message').innerHTML = `<span class="success">🦅 대출금을 상환하여 신용을 지켜냈습니다!</span>`;
    updateUI();
}

function autoExecuteDebt() {
    if (myDebt <= 0) return;

    if (myPoints >= myDebt) {
        myPoints -= myDebt;
        myDebt = 0;
        alert("🔔 [알림] 대출 만기 시간 초과로 계좌에서 전액 자동 상환 출금되었습니다.");
        document.getElementById('bank-message').innerText = "기한 만료로 자동상환되었습니다.";
    } else {
        isCreditBanned = true;
        alert("🚨 [파산] 기한 내 사채를 갚지 못해 신용불량자가 되었습니다! 지옥 광산으로 강제 호송됩니다.");
        switchPage('slave');
    }
    updateUI();
}

// 과열 자동 감소 주기 엔진
clearInterval(cooldownTimer);
cooldownTimer = setInterval(() => {
    if (mineFatigue > 0) {
        mineFatigue -= 2; 
        if (mineFatigue < 0) mineFatigue = 0;
        updateFatigueBar();
    }
}, 200);

function updateFatigueBar() {
    const bar = document.getElementById('fatigue-bar-core');
    const text = document.getElementById('fatigue-bar-text');
    bar.style.width = mineFatigue + '%';
    text.innerText = `근육통 임계치: ${mineFatigue}%`;

    if (mineFatigue >= 80) {
        bar.style.background = '#ff0000'; 
    } else {
        bar.style.background = 'linear-gradient(to right, #ffcc00, #ff3300)';
    }
}

function crackRock() {
    // 밸런스 완료: 게이지 상승폭이 타격당 3%로 부드럽습니다.
    mineFatigue += 3; 
    if (mineFatigue > 100) mineFatigue = 100;
    updateFatigueBar();

    if (mineFatigue >= 100) {
        mineFatigue = 0; 
        updateFatigueBar();
        
        const penaltyCost = 3000;
        if (myPoints >= penaltyCost) {
            myPoints -= penaltyCost;
        } else {
            const lack = penaltyCost - myPoints;
            myPoints = 0;
            myDebt += lack;
        }
        
        alert("🚨 [근육 파열] 무리한 작업으로 극심한 근육통이 발생했습니다! 병원 치료비로 3,000P가 청구되었습니다.");
        document.getElementById('slave-message').innerHTML = `<span class="fail">🚑 과로로 쓰러져 병원비 대금 3,000P가 지출되었습니다!</span>`;
        updateUI();
        return;
    }

    if (isCreditBanned) {
        if (myDebt > 0) {
            myDebt--;
            document.getElementById('slave-message').innerHTML = `⛏️ 깡! 돌을 부쉈습니다. (대출잔액 -1P)\n남은 타격 횟수: ${myDebt}번`;
            
            if (myDebt === 0) {
                isCreditBanned = false;
                alert("🎉 축하합니다! 노역을 마치고 신용도를 완전히 복구하여 자유의 몸이 되었습니다!");
                switchPage('slot');
            }
        }
    } else if (isVoluntaryMining) {
        myPoints++;
        document.getElementById('slave-message').innerHTML = `👷 정직한 노동으로 1포인트를 벌었습니다. (+1P)`;
    }
    updateUI();
}

function exitMineVoluntarily() {
    isVoluntaryMining = false;
    mineFatigue = 0;
    updateFatigueBar();
    alert("광산 체험을 마칩니다.");
    switchPage('slot');
}

// ================= [기존 게임 내부 고정 엔진 로직] =================
function updateSlotProbability() {
    const bet = parseInt(betInput.value) || 0;
    if (bet <= 0) { slotProbDisplay.innerText = `당첨 확률: 0.00% (최대 1.00%)`; return 0; }
    let calculatedProb = bet / 1000000; if (calculatedProb > 0.01) calculatedProb = 0.01;
    slotProbDisplay.innerText = `당첨 확률: ${(calculatedProb * 100).toFixed(2)}% (최대 1.00%)`;
    return calculatedProb;
}

function spinSlot() {
    const bet = parseInt(betInput.value);
    if (isNaN(bet) || bet <= 0) return alert('올바른 금액을 입력하세요.');
    if (bet > myPoints) return alert('포인트가 부족합니다.');
    
    myPoints -= bet; slotButton.disabled = true; slotMessage.innerHTML = "릴이 회전합니다..."; updateUI();
    let count = 0;
    const interval = setInterval(() => {
        reels.forEach(reel => { reel.innerText = symbols[Math.floor(Math.random() * symbols.length)]; });
        count++;
        if (count > 10) {
            clearInterval(interval);
            const winProbability = updateSlotProbability();
            if (Math.random() < winProbability) {
                reels.forEach(reel => reel.innerText = '7');
                const wonAmount = jackpot + bet * 10; myPoints += wonAmount;
                slotMessage.innerHTML = `<span class="jackpot-win">🎉 777 대박 당첨! 🎉\n${wonAmount.toLocaleString()} P 획득!</span>`;
                jackpot = 10000;
            } else {
                jackpot += bet;
                let r1, r2, r3;
                do { r1 = symbols[Math.floor(Math.random() * symbols.length)]; r2 = symbols[Math.floor(Math.random() * symbols.length)]; r3 = symbols[Math.floor(Math.random() * symbols.length)]; } while (r1 === r2 && r2 === r3);
                reels[0].innerText = r1; reels[1].innerText = r2; reels[2].innerText = r3;
                slotMessage.innerHTML = `<span class="fail">꽝! ${bet.toLocaleString()} P를 날렸습니다.</span>`;
            }
            slotButton.disabled = false; updateUI();
        }
    }, 80);
}

function selectTool(cost) {
    selectedToolCost = cost;
    document.querySelectorAll('.mining-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tool-${cost}`).classList.add('active');
}

function startMining() {
    if (selectedToolCost > myPoints) return alert('포인트가 부족합니다!');
    myPoints -= selectedToolCost; mineButton.disabled = true; miningMessage.innerHTML = "땅을 파는 중... ⛏️🧱"; updateUI();
    setTimeout(() => {
        const rand = Math.random();
        if (rand < 0.50) {
            const superWinRand = Math.random(); let profitPercent; let isSuper = false;
            if (superWinRand < 0.10) { profitPercent = Math.floor(Math.random() * (99 - 60 + 1)) + 60; isSuper = true; }
            else { profitPercent = Math.floor(Math.random() * (49 - 20 + 1)) + 20; }
            const profit = Math.floor(selectedToolCost * (profitPercent / 100)); const totalReturn = selectedToolCost + profit; myPoints += totalReturn;
            if (isSuper) miningMessage.innerHTML = `<span class="jackpot-win">✨ [초대박] 노다지 발견! (+${profitPercent}%) ✨\n원금 포함 ${totalReturn.toLocaleString()} P 획득!</span>`;
            else miningMessage.innerHTML = `<span class="success">👍 [성공] 광물 채굴 완료! (+${profitPercent}%) \n원금 포함 ${totalReturn.toLocaleString()} P 획득.</span>`;
        } else {
            const totalLossRand = Math.random();
            if (totalLossRand < 0.15) { miningMessage.innerHTML = `<span class="fail">🚨 [전부 상실] 사고 발생!\n투자금 ${selectedToolCost.toLocaleString()} P를 모두 날렸습니다.</span>`; }
            else {
                const returnPercent = Math.floor(Math.random() * (70 - 30 + 1)) + 30; const partialReturn = Math.floor(selectedToolCost * (returnPercent / 100)); myPoints += partialReturn;
                miningMessage.innerHTML = `<span class="fail">📉 [실패] 헛수고를 했습니다. (-${100 - returnPercent}%)\n${partialReturn.toLocaleString()} P만 돌려받았습니다.</span>`;
            }
        }
        mineButton.disabled = false; updateUI();
    }, 1000);
}

function initHorseTable() {
    const tbody = document.getElementById('horse-table-body');
    tbody.innerHTML = '';
    horses.forEach((horse, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${idx + 1}</td><td><strong>${horse.name}</strong></td><td>${(horse.prob * 100).toFixed(0)}%</td><td style="color:var(--neon-yellow); font-weight:bold;">x${horse.dividend.toFixed(1)}</td><td><button class="select-horse-btn ${idx===0?'selected':''}" id="horse-btn-${idx}" onclick="selectHorse(${idx})">선택</button></td>`;
        tbody.appendChild(tr);
    });
}

function selectHorse(idx) {
    selectedHorseIdx = idx;
    document.querySelectorAll('.select-horse-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById(`horse-btn-${idx}`).classList.add('selected');
}

function startRace() {
    const bet = parseInt(raceBetInput.value);
    if (isNaN(bet) || bet <= 0) return alert('올바른 금액을 입력하세요.');
    if (bet > myPoints) return alert('포인트가 부족합니다.');
    myPoints -= bet; raceButton.disabled = true; document.querySelectorAll('.select-horse-btn').forEach(b => b.disabled = true); updateUI();

    const horseElements = []; const positions = [40, 40, 40, 40, 40];
    const trackWidth = document.querySelector('.race-track').clientWidth - 60;
    for(let i=0; i<5; i++) { horseElements.push(document.getElementById(`horse-${i}`)); horseElements[i].style.right = '40px'; horseElements[i].innerText = '🐎'; }
    raceMessage.innerHTML = "🏇 경마가 시작되었습니다! 왼쪽 결승선을 향해 질주합니다!";

    let winnerIdx = 0; const rand = Math.random();
    if (rand < 0.40) winnerIdx = 0; else if (rand < 0.65) winnerIdx = 1; else if (rand < 0.83) winnerIdx = 2; else if (rand < 0.95) winnerIdx = 3; else winnerIdx = 4;
    let isManipulated = false;
    if (winnerIdx === selectedHorseIdx && Math.random() < 0.70) { isManipulated = true; let alternative; do { alternative = Math.floor(Math.random() * 5); } while (alternative === selectedHorseIdx); winnerIdx = alternative; }

    let raceTime = 0; const maxRaceTime = 130;
    const raceInterval = setInterval(() => {
        raceTime++;
        for (let i = 0; i < 5; i++) {
            let speed = Math.random() * 5 + 1;
            if (i === winnerIdx && raceTime > 70) speed += 4;
            if (raceTime > 40 && raceTime < 80 && i === selectedHorseIdx) {
                if (Math.random() < 0.25) { speed = -2; horseElements[i].innerText = '🤢'; } 
                else { if(horseElements[i].innerText === '🤢') horseElements[i].innerText = '🐎'; }
            }
            positions[i] += speed;
            if (positions[i] > trackWidth - 20) positions[i] = trackWidth - 20;
            if (i !== winnerIdx && positions[i] >= trackWidth - 25 && raceTime < maxRaceTime) positions[i] = trackWidth - 25;
            horseElements[i].style.right = positions[i] + 'px';
        }
        if (raceTime >= maxRaceTime) {
            clearInterval(raceInterval);
            horseElements[winnerIdx].style.right = trackWidth + 'px'; horseElements[winnerIdx].innerText = '👑';
            if (selectedHorseIdx === winnerIdx) {
                const payout = Math.floor(bet * horses[winnerIdx].dividend); myPoints += payout;
                raceMessage.innerHTML = `<span class="success">🎉 [승리] 조작을 뚫고 우승! 🎉\n${horses[winnerIdx].name}이(가) 승리하여 ${payout.toLocaleString()} P를 얻었습니다!</span>`;
            } else {
                let msg = `<span class="fail">❌ [패배] 우승마: ${winnerIdx + 1}번 ${horses[winnerIdx].name}\n베팅한 포인트가 소멸되었습니다.</span>`;
                if (isManipulated) msg += `\n<small style="color:#ff6666;">* 내부 정보: 베팅 조작단이 실시간으로 고삐를 당겼습니다.</small>`;
                raceMessage.innerHTML = msg;
            }
            raceButton.disabled = false; document.querySelectorAll('.select-horse-btn').forEach(b => b.disabled = false); updateUI();
        }
    }, 100);
}

// 초기 로딩 시 실행될 이니셜라이저
initHorseTable();
initScratchUI();
updateUI();
