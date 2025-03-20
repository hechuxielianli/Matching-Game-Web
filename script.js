// JavaScript Document
// 游戏状态变量
const gameConfig = {
    difficulty: 'medium', // 'easy', 'medium', 'hard'
    rows: 3,
    columns: 6,
    pairCount: 9,
    aiDelay: 1000, // AI思考时间(毫秒)
    flipDelay: 1000, // 卡片翻回的延迟
    enableSound: true,
	enableMusic: true
};

// 扩展游戏状态
const gameState = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    playerScore: 0,
    aiScore: 0,
    isPlayerTurn: true,
    canFlip: true,
    aiMemory: {},
    gameStarted: false,
    gameEnded: false,
    turnCount: 0,
    startTime: null,
    endTime: null
};

const gameSounds = {
    flip: new Audio('sounds/flip.mp3'),
    match: new Audio('sounds/match.mp3'),
    fail: new Audio('sounds/fail.mp3'),
    win: new Audio('sounds/win.mp3'),
    lose: new Audio('sounds/lose.mp3')
};
// 初始化背景音乐
function initBackgroundMusic() {
    // 预加载背景音乐
    backgroundMusic.load();
    
    // 更新音乐按钮状态
    updateMusicButton();
    
    // 添加用户交互后自动播放音乐的事件监听
    document.addEventListener('click', function startMusicOnInteract() {
        if (!isMusicPlaying && gameConfig.enableMusic) {
            toggleBackgroundMusic();
        }
        // 移除事件监听器，确保只执行一次
        document.removeEventListener('click', startMusicOnInteract);
    }, { once: true });
}

// 页面加载完成后启动游戏
document.addEventListener('DOMContentLoaded', initGame);

function preloadImages(imagePaths) {
    const preloadPromises = imagePaths.map(path => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = path;
        });
    });
    
    return Promise.all(preloadPromises);
}



// 添加背景音乐对象
const backgroundMusic = new Audio('sounds/background-music.mp3');
backgroundMusic.loop = true; // 设置循环播放
backgroundMusic.volume = 0.5; // 设置音量

// 背景音乐状态
let isMusicPlaying = false;

// 切换背景音乐函数
function toggleBackgroundMusic() {
    const musicButton = document.getElementById('music-toggle');
    
    if (isMusicPlaying) {
        backgroundMusic.pause();
        musicButton.innerHTML = '<i class="fas fa-music"></i>';
        musicButton.setAttribute('title', '播放背景音乐');
        isMusicPlaying = false;
    } else {
        backgroundMusic.play().catch(error => console.log('背景音乐播放失败:', error));
        musicButton.innerHTML = '<i class="fas fa-pause"></i>';
        musicButton.setAttribute('title', '暂停背景音乐');
        isMusicPlaying = true;
    }
	// 更新按钮状态
    updateMusicButton();
}

function playSound(sound) {
    if (gameConfig.enableSound) {
        gameSounds[sound].currentTime = 0;
        gameSounds[sound].play().catch(error => console.log('播放声音失败:', error));
    }
}

// 切换声音函数
function toggleSound() {
    gameConfig.enableSound = !gameConfig.enableSound;
    
    const soundButton = document.getElementById('sound-toggle');
    if (gameConfig.enableSound) {
        soundButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        soundButton.setAttribute('title', '关闭声音');
    } else {
        soundButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
        soundButton.setAttribute('title', '开启声音');
    }
}

async function initGame() {
	// 保存当前的音乐播放状态
    const wasMusicPlaying = isMusicPlaying;
    
    // 如果音乐正在播放，暂停它以避免重叠播放
    if (isMusicPlaying) {
        backgroundMusic.pause();
    }
	
    resetGameState();
    createCards();
    
    // 预加载所有图片
    const imagePaths = [...new Set(gameState.cards.map(card => card.type))];
    try {
        await preloadImages(imagePaths);
        console.log('所有图片预加载完成');
    } catch (error) {
        console.error('图片预加载失败', error);
    }
    
    renderGameBoard();
    updateScoreDisplay();
    updateTurnIndicator();
    updateSoundButton();
	
    // 恢复音乐播放状态
    if (wasMusicPlaying) {
        // 确保音乐能够继续播放
        backgroundMusic.play().catch(error => console.log('背景音乐恢复失败:', error));
        isMusicPlaying = true;
    }
    
    // 更新音乐按钮状态以匹配当前的播放状态
    updateMusicButton();
}


function updateSoundButton() {
    const soundButton = document.getElementById('sound-toggle');
    if (soundButton) {
        if (gameConfig.enableSound) {
            soundButton.innerHTML = '<i class="fas fa-volume-up"></i>';
            soundButton.setAttribute('title', '关闭声音');
        } else {
            soundButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
            soundButton.setAttribute('title', '开启声音');
        }
    }
}
// 更新音乐按钮状态
function updateMusicButton() {
    const musicButton = document.getElementById('music-toggle');
    if (musicButton) {
        if (isMusicPlaying) {
            musicButton.innerHTML = '<i class="fas fa-pause"></i>';
            musicButton.setAttribute('title', '暂停背景音乐');
        } else {
            musicButton.innerHTML = '<i class="fas fa-music"></i>';
            musicButton.setAttribute('title', '播放背景音乐');
        }
    }
}

function resetGameState() {
    gameState.cards = [];
    gameState.flippedCards = [];
    gameState.matchedPairs = 0;
    gameState.playerScore = 0;
    gameState.aiScore = 0;
    gameState.isPlayerTurn = true;
    gameState.canFlip = true;
    gameState.aiMemory = {};
    gameState.gameEnded = false;
	
    document.getElementById('game-board').innerHTML = '';
    document.getElementById('game-message').textContent = '';
}

function createCards() {
    // 创建9对不同的卡片
    const cardTypes = ['img/1.png', 'img/2.png', 'img/3.png', 'img/4.png', 'img/5.png', 'img/6.png', 'img/7.png', 'img/8.png', 'img/9.png'];
    let cardPairs = [];
    
    // 每种类型创建两张卡片
    cardTypes.forEach((type, index) => {
        cardPairs.push(
            { id: index * 2, type: type, isFlipped: false, isMatched: false },
            { id: index * 2 + 1, type: type, isFlipped: false, isMatched: false }
        );
    });
    
    // 洗牌算法
    for (let i = cardPairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }
    
    gameState.cards = cardPairs;
}
function renderGameBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = ''; // 清空游戏板
    
    gameState.cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.id = card.id;
        
        // 创建卡片正面 (包含图片)
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        
        // 创建图片元素
        const cardImage = document.createElement('img');
        cardImage.src = card.type; // 图片路径
        cardImage.alt = "Card image";
        cardImage.className = 'card-image';
        cardFront.appendChild(cardImage);
        
        // 创建卡片背面
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        
        // 组装卡片
        cardElement.appendChild(cardFront);
        cardElement.appendChild(cardBack);
        
        // 恢复卡片状态 (如果重新开始游戏时保留状态)
        if (card.isFlipped || card.isMatched) {
            cardElement.classList.add('flipped');
            if (card.isMatched) {
                cardElement.classList.add('matched');
            }
        }
        
        // 添加点击事件
        cardElement.addEventListener('click', () => handleCardClick(card.id));
        
        gameBoard.appendChild(cardElement);
    });
}


function handleCardClick(cardId) {
    // 检查是否可以翻牌
    if (!gameState.canFlip || !gameState.isPlayerTurn) return;
    
    const card = gameState.cards.find(card => card.id === cardId);
    
    // 检查卡片是否已翻开或已匹配
    if (card.isFlipped || card.isMatched) return;
    
    // 检查是否已经翻开了两张牌
    if (gameState.flippedCards.length === 2) return;
    
    // 翻开卡片
    flipCard(cardId);
    
    // 添加到已翻开卡片列表
    gameState.flippedCards.push(card);
    
    // 如果翻开了两张牌，检查是否匹配
    if (gameState.flippedCards.length === 2) {
        checkMatch();
    }
}

function flipCard(cardId) {
    const card = gameState.cards.find(card => card.id === cardId);
    card.isFlipped = true;
    
    // 更新DOM - 添加flipped类来显示卡片正面
    const cardElement = document.querySelector(`.card[data-id="${cardId}"]`);
    cardElement.classList.add('flipped');
    
	// 播放翻牌声音
    playSound('flip');
	
    // 更新AI记忆
    gameState.aiMemory[card.type] = gameState.aiMemory[card.type] || [];
    if (!gameState.aiMemory[card.type].includes(cardId)) {
        gameState.aiMemory[card.type].push(cardId);
    }
}
function checkMatch() {
    const [card1, card2] = gameState.flippedCards;
    
    gameState.canFlip = false; // 检查匹配过程中禁止翻牌
    
    // 检查是否匹配
    if (card1.type === card2.type) {
        // 匹配成功
        setTimeout(() => {
            handleMatchSuccess();
            // 不需要在这里清空flippedCards，已在handleMatchSuccess中处理
            checkGameEnd();
        }, 300); // 减少延迟
    } else {
        // 匹配失败
        handleMatchFail();
        // 注意：handleMatchFail中有setTimeout，会延迟恢复canFlip状态
    }
}



function handleMatchSuccess() {
    const [card1, card2] = gameState.flippedCards;
    
    // 设置卡片为已匹配
    card1.isMatched = true;
    card2.isMatched = true;
    
    // 更新DOM - 添加matched类但保留flipped类
    document.querySelector(`.card[data-id="${card1.id}"]`).classList.add('matched');
    document.querySelector(`.card[data-id="${card2.id}"]`).classList.add('matched');
    
	
    // 增加得分
    if (gameState.isPlayerTurn) {
        gameState.playerScore++;
        document.getElementById('game-message').textContent = '匹配成功！';
    } else {
        gameState.aiScore++;
        document.getElementById('game-message').textContent = '电脑匹配成功！到你了！';
    }
    
    gameState.matchedPairs++;
    
    // 修改：匹配成功后也切换回合
    gameState.isPlayerTurn = !gameState.isPlayerTurn;
    updateTurnIndicator();
    
    // 清空已翻开卡片列表
    gameState.flippedCards = [];
    
    // 恢复可翻牌状态
    gameState.canFlip = true;
    
    updateScoreDisplay();
    
    // 如果轮到电脑，则触发电脑回合
    if (!gameState.isPlayerTurn && !gameState.gameEnded) {
        setTimeout(performAITurn, 500); // 减少延迟到0.5秒
    }
}


function handleMatchFail() {
    const [card1, card2] = gameState.flippedCards;
    
    // 设置延迟，让玩家能看到翻开的卡片内容，但减少时间
    setTimeout(() => {
        // 翻回卡片
        card1.isFlipped = false;
        card2.isFlipped = false;
        
        // 更新DOM - 移除flipped类以翻回卡片
        document.querySelector(`.card[data-id="${card1.id}"]`).classList.remove('flipped');
        document.querySelector(`.card[data-id="${card2.id}"]`).classList.remove('flipped');
        
        // 切换回合
        gameState.isPlayerTurn = !gameState.isPlayerTurn;
        updateTurnIndicator();
        
        // 清空已翻开卡片列表
        gameState.flippedCards = [];
        
        document.getElementById('game-message').textContent = gameState.isPlayerTurn ? 
            '轮到你的回合' : '电脑回合';
        
        gameState.canFlip = true; // 匹配结束后允许翻牌
        
        // 如果轮到电脑，则触发电脑回合
        if (!gameState.isPlayerTurn && !gameState.gameEnded) {
            setTimeout(performAITurn, 500); // 减少延迟到0.5秒
        }
    }, 800); // 减少延迟到0.8秒
}


function updateScoreDisplay() {
    document.getElementById('player-score').textContent = gameState.playerScore;
    document.getElementById('ai-score').textContent = gameState.aiScore;
}

function updateTurnIndicator() {
    const indicator = document.getElementById('turn-indicator');
    indicator.textContent = gameState.isPlayerTurn ? '玩家回合' : '电脑回合';
    indicator.className = 'turn-indicator ' + (gameState.isPlayerTurn ? 'player-turn' : 'ai-turn');
}

function checkGameEnd() {
    if (gameState.matchedPairs >= gameConfig.pairCount) {
        gameState.gameEnded = true;
        gameState.endTime = Date.now();
        
        let message = '';
        if (gameState.playerScore > gameState.aiScore) {
            message = '游戏结束! 你赢了!';
			playSound('win');
        } else if (gameState.playerScore < gameState.aiScore) {
            message = '游戏结束! 电脑赢了!';
			playSound('fail');
        } else {
            message = '游戏结束! 平局!';
			playSound('win');
        }
        
        document.getElementById('game-message').textContent = message;
    }
}

function performAITurn() {
    // 如果无法翻牌或不是电脑回合，则返回
    if (!gameState.canFlip || gameState.isPlayerTurn || gameState.gameEnded) {
        return;
    }
    
    // 防止多次调用
    gameState.canFlip = false;
    
    // 根据难度调整AI智能程度
    let makeRandomMove = true;
    let firstCardId, secondCardId;
    
    if (gameConfig.difficulty !== 'easy') {
        // 检查AI记忆中是否有已知的配对
        const knownPairs = findKnownPairs();
        
        if (knownPairs.length > 0 && (gameConfig.difficulty === 'hard' || Math.random() > 0.3)) {
            // 选择一对已知的配对
            const pairIds = knownPairs[Math.floor(Math.random() * knownPairs.length)];
            firstCardId = pairIds[0];
            secondCardId = pairIds[1];
            makeRandomMove = false;
        }
    }
    
    // 如果没有已知配对或难度设置为随机行为，则随机选择
    if (makeRandomMove) {
        const availableCards = gameState.cards.filter(card => !card.isMatched && !card.isFlipped);
        
        if (availableCards.length >= 2) {
            const randomIndexes = getRandomIndexes(0, availableCards.length - 1, 2);
            firstCardId = availableCards[randomIndexes[0]].id;
            secondCardId = availableCards[randomIndexes[1]].id;
        } else {
            // 没有足够的卡牌可翻
            gameState.canFlip = true;
            return;
        }
    }
    
    // 执行AI的移动
    if (firstCardId !== undefined && secondCardId !== undefined) {
        const card1 = gameState.cards.find(card => card.id === firstCardId);
        
        // 第一张牌
        flipCard(firstCardId);
        gameState.flippedCards.push(card1);
        
        // 第二张牌延迟翻开
        setTimeout(() => {
            const card2 = gameState.cards.find(card => card.id === secondCardId);
            flipCard(secondCardId);
            gameState.flippedCards.push(card2);
            
            // 检查匹配
            checkMatch();
        }, 500); // 减少延迟到0.5秒
    } else {
        // 如果无法选择卡牌，恢复可翻牌状态
        gameState.canFlip = true;
    }
}

function findKnownPairs() {
    const pairs = [];
    
    // 遍历AI记忆
    for (const type in gameState.aiMemory) {
        const cardIds = gameState.aiMemory[type];
        
        // 如果记忆中有两张相同类型的卡且未匹配，则可以形成一对
        if (cardIds.length >= 2) {
            const unmatchedCardIds = cardIds.filter(id => {
                const card = gameState.cards.find(c => c.id === id);
                return !card.isMatched;
            });
            
            if (unmatchedCardIds.length >= 2) {
                pairs.push([unmatchedCardIds[0], unmatchedCardIds[1]]);
            }
        }
    }
    
    return pairs;
}

function getRandomIndexes(min, max, count) {
    const indexes = [];
    while (indexes.length < count) {
        const randomIndex = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!indexes.includes(randomIndex)) {
            indexes.push(randomIndex);
        }
    }
    return indexes;
}

/* 
    Copyright (c) 2025 Huang Zhanpeng. All Rights Reserved.
    Licensed under the MIT License.
*/


