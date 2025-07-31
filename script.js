// --- DOM 元素 ---
const setupScreen = document.getElementById('setup-screen');
const quizScreen = document.getElementById('quiz-screen');
const combo = document.getElementById('topic-combo');
const questionLabel = document.getElementById('question-label');
const anss = document.querySelectorAll('.answer-btn');
const correctCountSpan = document.getElementById('correct-count');
const totalCountSpan = document.getElementById('total-count');

// --- 全局變數 ---
const keys = "dfjk"; // 對應按鈕的鍵盤按鍵 (小寫)
let fileMap = {};    // 儲存 file-map.json 的內容
let data = [];       // 儲存當前題庫的所有題目
let ques = [];       // 儲存畫面上四個選項對應的 "問題" (英文)
let untilIndex = 0;  // 追蹤題庫使用到第幾題
let correctCount = 0; // 追蹤答對題數
let isAnimating = false; // 用來防止動畫重複觸發的旗標

// --- 主要功能函式 ---

async function start() {
    try {
        const response = await fetch('file-map.json');
        if (!response.ok) throw new Error(`HTTP 錯誤! 狀態: ${response.status}`);
        fileMap = await response.json();

        for (const key in fileMap) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            combo.appendChild(option);
        }
        combo.addEventListener('change', afterSelectCombo);
    } catch (error) {
        console.error("無法載入 file-map.json:", error);
        alert("無法載入題庫設定檔 (file-map.json)，請檢查檔案是否存在。");
    }
}

async function afterSelectCombo() {
    const selectedKey = combo.value;
    if (!selectedKey) return;

    const fileName = fileMap[selectedKey];
    if (!fileName) return;

    try {
        const response = await fetch(fileName);
        if (!response.ok) throw new Error(`HTTP 錯誤! 狀態: ${response.status}`);
        let loadedData = await response.json();

        if (!Array.isArray(loadedData) || loadedData.length < 4) {
            alert("題庫檔案格式錯誤或題目數量不足 (至少需要4題)。");
            return;
        }

        data = shuffle(loadedData);
        setupScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        ques = [];
        untilIndex = 0;
        correctCount = 0;

        updateScoreDisplay();

        for (let i = 0; i < 4; i++) {
            const [q, a] = getNextDataItem();
            ques.push(q);
            anss[i].textContent = a;
        }
        
        anss.forEach((button, index) => {
            button.onclick = () => handleAnswer(index);
        });
        
        document.removeEventListener('keydown', handleKeyPress);
        document.addEventListener('keydown', handleKeyPress);
        
        pickNewQuestion();
    } catch (error) {
        console.error(`無法載入測驗檔案 ${fileName}:`, error);
        alert(`無法載入題庫檔案 (${fileName})，請檢查檔案是否存在或格式是否正確。`);
        combo.value = "";
    }
}

/**
 * 處理使用者回答 - 已更新錯誤處理邏輯
 * @param {number} index - 使用者選擇的答案按鈕索引 (0-3)
 */
function handleAnswer(index) {
    // 如果正在播放錯誤動畫，則不處理任何點擊，防止連續出錯導致的畫面問題
    if (isAnimating) {
        return;
    }

    if (questionLabel.textContent === ques[index]) {
        // --- 回答正確 ---
        correctCount++;
        updateScoreDisplay();
        const [nextQ, nextA] = getNextDataItem();
        anss[index].textContent = nextA;
        ques[index] = nextQ;
        pickNewQuestion();
    } else {
        // --- 回答錯誤 ---
        isAnimating = true; // 標記為正在動畫中

        // 1. 添加 class 來觸發 CSS 動畫
        questionLabel.classList.add('animate-flash');

        // 2. 監聽動畫結束事件。{ once: true } 確保這個監聽器只會執行一次，然後自動移除。
        questionLabel.addEventListener('animationend', () => {
            // 3. 動畫結束後，移除 class，以便下次可以再次觸發
            questionLabel.classList.remove('animate-flash');
            
            // 4. 在動畫完全結束後，才更換題目
            pickNewQuestion(questionLabel.textContent);

            // 5. 動畫及後續處理都已完成，解除鎖定
            isAnimating = false;
        }, { once: true });
    }
}

// --- 輔助函式 (無變動) ---

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getNextDataItem() {
    if (untilIndex >= data.length) {
        untilIndex = 0;
        correctCount = 0;
        alert("恭喜完成一輪！將重新開始。");
        data = shuffle(data);
        updateScoreDisplay();
    }
    const item = data[untilIndex];
    untilIndex++;
    return item;
}

function pickNewQuestion(excludeQuestion = null) {
    let possibleQuestions = ques;
    if (excludeQuestion) {
        possibleQuestions = ques.filter(q => q !== excludeQuestion);
    }
    const newQuestion = possibleQuestions[Math.floor(Math.random() * possibleQuestions.length)];
    questionLabel.textContent = newQuestion;
}

function updateScoreDisplay() {
    correctCountSpan.textContent = correctCount;
    totalCountSpan.textContent = data.length;
}

function handleKeyPress(event) {
    if (document.activeElement === combo) return;
    const key = event.key.toLowerCase();
    const index = keys.indexOf(key);
    if (index !== -1) {
        event.preventDefault(); 
        handleAnswer(index);
    }
}

// --- 程式初始化 ---
document.addEventListener('DOMContentLoaded', start);