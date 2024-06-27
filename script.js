// 전역 변수 선언
let points = 0;
let dataChart, scatterChart;
let currentPattern = [];
let currentPatternAnswer;
const scatterData = [];
let gaInterval;
let sortingArray = [];
let sortingInterval;
let sortingSpeed = 50;
let puzzleState = [1, 2, 3, 4, 5, 6, 7, 8, 0];
let moveCount = 0;
let networkNodes = [];
let networkConnections = [];
const layers = [3, 4, 4, 2];

// 포인트 업데이트 함수
function updatePoints(amount) {
    points += amount;
    document.getElementById('pointsDisplay').textContent = `포인트: ${points}`;
}

// 데이터 시각화 함수
function drawChart() {
    const ctx = document.getElementById('dataChart').getContext('2d');
    const chartType = document.getElementById('chartType').value;
    const data = Array.from({ length: 5 }, (_, i) => Number(document.getElementById(`data${i + 1}`).value));

    if (dataChart) {
        dataChart.destroy();
    }

    dataChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: ['A', 'B', 'C', 'D', 'E'],
            datasets: [{
                label: '데이터 값',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ],
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    updatePoints(1);
}

// 패턴 인식 함수
function generatePattern() {
    const difficulty = document.getElementById('difficultyLevel').value;
    let pattern = [];
    let rule;

    switch(difficulty) {
        case 'easy':
            rule = Math.floor(Math.random() * 5) + 1;
            pattern = Array.from({ length: 5 }, (_, i) => i * rule);
            currentPatternAnswer = pattern[4] + rule;
            break;
        case 'medium':
            rule = Math.floor(Math.random() * 3) + 2;
            pattern = Array.from({ length: 5 }, (_, i) => Math.pow(rule, i));
            currentPatternAnswer = Math.pow(rule, 5);
            break;
        case 'hard':
            pattern = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10));
            rule = (pattern[4] - pattern[3]) + (pattern[3] - pattern[2]);
            currentPatternAnswer = pattern[4] + rule;
            break;
    }

    currentPattern = pattern;
    document.getElementById('patternDisplay').textContent = pattern.join(', ') + ', ?';
}

// 패턴 확인 함수
function checkPattern() {
    const guess = parseInt(document.getElementById('patternGuess').value);
    const result = document.getElementById('patternResult');
    if (guess === currentPatternAnswer) {
        result.textContent = "정답입니다! 패턴을 잘 이해했어요.";
        updatePoints(5);
    } else {
        result.textContent = `아쉽네요. 정답은 ${currentPatternAnswer}입니다. 다시 도전해보세요!`;
    }
}

function initScatterPlot() {
    const ctx = document.getElementById('scatterPlot').getContext('2d');
    scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: '데이터 포인트',
                data: scatterData,
                backgroundColor: 'rgb(255, 99, 132)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom'
                }
            },
            onClick: function(e) {
                const canvasPosition = Chart.helpers.getRelativePosition(e, scatterChart);
                const dataX = scatterChart.scales.x.getValueForPixel(canvasPosition.x);
                const dataY = scatterChart.scales.y.getValueForPixel(canvasPosition.y);
                
                scatterData.push({x: dataX, y: dataY});
                scatterChart.update();
                updatePoints(1);

                if (scatterData.length >= 2) {
                    drawRegressionLine();
                }
            }
        }
    });
}

function drawRegressionLine() {
    if (scatterData.length < 2) return;

    const n = scatterData.length;
    const sumX = scatterData.reduce((sum, point) => sum + point.x, 0);
    const sumY = scatterData.reduce((sum, point) => sum + point.y, 0);
    const sumXY = scatterData.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumX2 = scatterData.reduce((sum, point) => sum + point.x * point.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const minX = Math.min(...scatterData.map(p => p.x));
    const maxX = Math.max(...scatterData.map(p => p.x));

    // 기존 회귀선 데이터셋 제거
    scatterChart.data.datasets = scatterChart.data.datasets.filter(dataset => dataset.label !== '회귀선');

    // 새 회귀선 추가
    scatterChart.data.datasets.push({
        type: 'line',
        label: '회귀선',
        data: [
            {x: minX, y: slope * minX + intercept},
            {x: maxX, y: slope * maxX + intercept}
        ],
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 2,
        fill: false
    });

    scatterChart.update();
}
// 신경망 그리기 함수
function drawNeuralNetwork() {
    const canvas = document.getElementById('networkCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const layerDistance = canvas.width / (layers.length + 1);
    const nodeRadius = 15;

    networkNodes = [];
    networkConnections = [];

    // 노드 그리기
    for (let i = 0; i < layers.length; i++) {
        for (let j = 0; j < layers[i]; j++) {
            const x = (i + 1) * layerDistance;
            const y = (canvas.height / (layers[i] + 1)) * (j + 1);
            ctx.beginPath();
            ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.stroke();
            networkNodes.push({x, y, layer: i, index: j, value: 0});
        }
    }

    // 연결선 그리기
    for (let i = 0; i < layers.length - 1; i++) {
        for (let j = 0; j < layers[i]; j++) {
            for (let k = 0; k < layers[i + 1]; k++) {
                const startNode = networkNodes.find(node => node.layer === i && node.index === j);
                const endNode = networkNodes.find(node => node.layer === i + 1 && node.index === k);
                ctx.beginPath();
                ctx.moveTo(startNode.x + nodeRadius, startNode.y);
                ctx.lineTo(endNode.x - nodeRadius, endNode.y);
                ctx.stroke();
                networkConnections.push({start: startNode, end: endNode, value: 0});
            }
        }
    }

    canvas.onclick = activateNetwork;
    updatePoints(2);
}
// 신경망 활성화 함수
function activateNetwork(event) {
    const canvas = document.getElementById('networkCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 클릭한 위치와 가장 가까운 입력 노드 찾기
    const inputNodes = networkNodes.filter(node => node.layer === 0);
    const clickedNode = inputNodes.reduce((closest, node) => {
        const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
        return distance < closest.distance ? {node, distance} : closest;
    }, {node: null, distance: Infinity}).node;

    if (clickedNode) {
        animateNetworkFlow(clickedNode);
    }
}

// 신경망 흐름 애니메이션 함수
function animateNetworkFlow(startNode) {
    const canvas = document.getElementById('networkCanvas');
    const ctx = canvas.getContext('2d');

    // 모든 노드와 연결 초기화
    networkNodes.forEach(node => node.value = 0);
    networkConnections.forEach(conn => conn.value = 0);

    startNode.value = 1;

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 노드 그리기
        networkNodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 15, 0, 2 * Math.PI);
            ctx.fillStyle = `rgb(255, ${255 - node.value * 255}, ${255 - node.value * 255})`;
            ctx.fill();
            ctx.stroke();
        });

        // 연결선 그리기
        networkConnections.forEach(conn => {
            ctx.beginPath();
            ctx.moveTo(conn.start.x + 15, conn.start.y);
            ctx.lineTo(conn.end.x - 15, conn.end.y);
            ctx.strokeStyle = `rgba(0, 0, 255, ${conn.value})`;
            ctx.lineWidth = 2 + 3 * conn.value;
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'black';
        });

        // 다음 레이어로 값 전파
        const currentLayer = networkNodes.find(node => node.value > 0).layer;
        if (currentLayer < layers.length - 1) {
            networkNodes.filter(node => node.layer === currentLayer && node.value > 0).forEach(activeNode => {
                const connections = networkConnections.filter(conn => conn.start === activeNode);
                connections.forEach(conn => {
                    conn.value = Math.min(conn.value + 0.1, 1);
                    conn.end.value = Math.max(conn.end.value, conn.value);
                });
            });
            requestAnimationFrame(animate);
        }
    }

    animate();
}

// 초기화 함수
function initializeAll() {
    drawChart();
    generatePattern();
    initScatterPlot();
    drawNeuralNetwork();
    // 기타 초기화 함수들...
}

// 페이지 로드 시 모든 기능 초기화
window.addEventListener('DOMContentLoaded', initializeAll);
// 이미지 분류 시뮬레이션
const imageData = [
    { src: "images/roses_vintage.jpg", label: "roses", description: "빈티지 스타일의 장미 이미지" },
    { src: "images/dandelion_field.jpg", label: "dandelion", description: "민들레 들판" },
    { src: "images/tulips_windmill.jpg", label: "tulips", description: "풍차와 튤립 밭" },
    { src: "images/sunflowers.jpg", label: "sunflowers", description: "해바라기 밭" },
    { src: "images/dandelion_closeup.jpg", label: "dandelion", description: "민들레 클로즈업" },
    { src: "images/roses_bouquet.jpg", label: "roses", description: "장미 꽃다발" },
    { src: "images/dandelion_seeds.jpg", label: "dandelion", description: "민들레 씨앗" },
    { src: "images/roses_fountain.jpg", label: "roses", description: "분수와 장미" },
    { src: "images/tulips_colorful.jpg", label: "tulips", description: "다양한 색상의 튤립" }
];

function setupImageClassification() {
    const imageContainer = document.getElementById('imageContainer');
    imageContainer.innerHTML = '';

    imageData.forEach((image) => {
        const imgElement = document.createElement('img');
        imgElement.src = image.src;
        imgElement.alt = image.description;
        imgElement.title = image.description;
        imgElement.classList.add('classification-image');

        imgElement.onclick = () => classifyImage(image.label, image.description);
        imageContainer.appendChild(imgElement);
    });
}

function classifyImage(actualLabel, description) {
    const labels = ['roses', 'dandelion', 'tulips', 'sunflowers'];
    let predictedLabel, confidence;

    if (Math.random() < 0.8) {
        predictedLabel = actualLabel;
        confidence = (Math.random() * 20 + 80).toFixed(2);
    } else {
        do {
            predictedLabel = labels[Math.floor(Math.random() * labels.length)];
        } while (predictedLabel === actualLabel);
        confidence = (Math.random() * 30 + 50).toFixed(2);
    }

    const resultText = `AI의 추측: ${predictedLabel} (확률: ${confidence}%)`;
    const correctnessText = predictedLabel === actualLabel ? 
        "정확합니다!" : `오답입니다. 실제 꽃은 ${actualLabel}입니다.`;
    const descriptionText = `선택한 이미지: ${description}`;

    document.getElementById('classificationResult').innerHTML = `${resultText}<br>${correctnessText}<br>${descriptionText}`;
    updatePoints(predictedLabel === actualLabel ? 1 : 0);
}

// 챗봇
const responses = {
    "안녕": ["안녕하세요!", "반가워요!", "어서오세요!"],
    "이름": ["제 이름은 AI 친구예요.", "저는 AI 친구라고 해요.", "AI 친구라고 불러주세요!"],
    "날씨": ["오늘 날씨가 좋네요!", "날씨 앱을 한번 확인해보는 건 어떨까요?", "밖에 나가기 좋은 날씨예요!"],
    "공부": ["열심히 공부하는 당신이 자랑스러워요!", "공부할 때는 집중력이 중요해요.", "조금씩 꾸준히 하는 게 비결이에요!"],
    "게임": ["게임도 적당히 즐기는 게 좋아요.", "새로운 게임을 배워보는 건 어떨까요?", "친구들과 함께 게임하면 더 재밌어요!"],
    "AI": ["AI는 정말 흥미로운 주제예요!", "AI에 대해 더 알고 싶으신가요?", "AI는 우리의 미래를 바꿀 거예요."],
    "음식": ["맛있는 음식은 행복의 비결이에요!", "오늘은 어떤 음식을 드셨나요?", "건강한 음식을 먹는 것이 중요해요."],
    "운동": ["운동은 건강에 정말 좋아요!", "가벼운 스트레칭부터 시작해보는 건 어떨까요?", "규칙적인 운동은 집중력 향상에도 도움이 돼요."],
    "책": ["책 읽는 것을 좋아하시나요?", "좋은 책을 읽으면 지식이 늘어나요.", "어떤 장르의 책을 좋아하세요?"],
    "친구": ["친구와 잘 지내고 있나요?", "좋은 친구는 인생의 보물이에요.", "새로운 친구를 사귀는 것도 좋은 경험이 될 거예요."]
};

const defaultResponses = [
    "흥미로운 이야기네요! 더 자세히 말씀해 주세요.",
    "그렇군요. 다른 이야기도 들려주세요!",
    "제가 잘 이해하지 못했어요. 다르게 설명해 주실 수 있나요?",
    "새로운 것을 배웠어요! 감사합니다.",
    "정말 재미있는 주제예요!"
];

const asciiExpressions = [
    "(^_^)", "(o_o)", "(^o^)", "(>_<)", "(*_*)"
];

let chatHistory = [];

function sendMessage() {
    const userInput = document.getElementById('userInput').value.trim();
    if (userInput === '') return;

    addToChatHistory('User', userInput);

    const botResponse = generateResponse(userInput);
    addToChatHistory('Bot', botResponse);

    document.getElementById('userInput').value = '';
    updateChatDisplay();
    updatePoints(1);
}

function generateResponse(input) {
    const lowercaseInput = input.toLowerCase();
    let response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];

    for (const [keyword, possibleResponses] of Object.entries(responses)) {
        if (lowercaseInput.includes(keyword)) {
            response = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
            break;
        }
    }

    const asciiExpression = asciiExpressions[Math.floor(Math.random() * asciiExpressions.length)];
    return `${response}\n${asciiExpression}`;
}

function addToChatHistory(sender, message) {
    chatHistory.push({ sender, message });
    if (chatHistory.length > 5) chatHistory.shift();
}

function updateChatDisplay() {
    const chatbox = document.getElementById('chatbox');
    chatbox.innerHTML = chatHistory.map(entry => 
        `<p class="chat-message ${entry.sender.toLowerCase()}-message"><strong>${entry.sender}:</strong> ${entry.message.replace('\n', '<br>')}</p>`
    ).join('');
    chatbox.scrollTop = chatbox.scrollHeight;
}

// 음성 인식 시뮬레이션
function startVoiceRecognition() {
    const result = document.getElementById('voiceResult');
    result.textContent = "음성을 인식 중입니다...";
    document.getElementById('startVoiceRecognition').disabled = true;
    setTimeout(() => {
        const randomPhrases = [
            "안녕하세요",
            "오늘 날씨가 좋아요",
            "인공지능은 재미있어요",
            "수학을 좋아해요"
        ];
        const recognizedText = randomPhrases[Math.floor(Math.random() * randomPhrases.length)];
        result.textContent = `인식된 텍스트: "${recognizedText}"`;
        document.getElementById('startVoiceRecognition').disabled = false;
        updatePoints(3);
    }, 2000);
}

// 데이터 정렬 시각화
function generateRandomData() {
    const size = 20;
    sortingArray = Array.from({length: size}, () => Math.floor(Math.random() * 100) + 1);
    visualizeSortingArray();
}

function visualizeSortingArray() {
    const container = document.getElementById('sortingVisualization');
    container.innerHTML = '';
    const maxValue = Math.max(...sortingArray);
    
    sortingArray.forEach((value, index) => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${(value / maxValue) * 100}%`;
        bar.style.width = `${100 / sortingArray.length}%`;
        bar.title = value;
        container.appendChild(bar);
    });
}

function startSorting() {
    if (sortingInterval) {
        clearInterval(sortingInterval);
    }
    
    let i = 0;
    let j = 0;
    const n = sortingArray.length;

    sortingInterval = setInterval(() => {
        if (i < n - 1) {
            if (j < n - i - 1) {
                if (sortingArray[j] > sortingArray[j + 1]) {
                    [sortingArray[j], sortingArray[j + 1]] = [sortingArray[j + 1], sortingArray[j]];
                    visualizeSortingArray();
                }
                j++;
            } else {
                j = 0;
                i++;
            }
        } else {
            clearInterval(sortingInterval);
            updatePoints(5);
        }
    }, sortingSpeed);
}

function stopSorting() {
    if (sortingInterval) {
        clearInterval(sortingInterval);
    }
}

function changeSortingSpeed(speed) {
    sortingSpeed = 1000 - parseInt(speed);  // 속도 반전
    if (sortingInterval) {
        stopSorting();
        startSorting();
    }
}

// 유전 알고리즘

const TARGET = "Hello, AI!";  // 목표 문자열 길이 축소
const POPULATION_SIZE = 50;   // 인구 크기 축소
const MUTATION_RATE = 0.01;

function startGeneticAlgorithm() {
    document.getElementById('targetString').textContent = TARGET;
    let population = Array(POPULATION_SIZE).fill().map(() => generateRandomString(TARGET.length));
    let generation = 0;

    const intervalId = setInterval(() => {
        const fitnesses = population.map(calculateFitness);
        const maxFitness = Math.max(...fitnesses);
        const bestString = population[fitnesses.indexOf(maxFitness)];

        document.getElementById('gaResult').innerHTML = `
            세대: ${generation}<br>
            최고 적합도: ${maxFitness}/${TARGET.length}<br>
            최고 문자열: ${bestString}
        `;

        if (maxFitness === TARGET.length) {
            clearInterval(intervalId);
            updatePoints(10);
            return;
        }

        const newPopulation = [];
        for (let i = 0; i < POPULATION_SIZE; i++) {
            const parent1 = selectParent(population, fitnesses);
            const parent2 = selectParent(population, fitnesses);
            let child = crossover(parent1, parent2);
            child = mutate(child);
            newPopulation.push(child);
        }

        population = newPopulation;
        generation++;
    }, 100);
}

function selectParent(population, fitnesses) {
    const totalFitness = fitnesses.reduce((a, b) => a + b, 0);
    let pick = Math.random() * totalFitness;
    let current = 0;
    for (let i = 0; i < population.length; i++) {
        current += fitnesses[i];
        if (current > pick) {
            return population[i];
        }
    }
    return population[population.length - 1];
}

// 초기화 함수 수정
function initializeAll() {
    drawChart();
    generatePattern();
    initScatterPlot();
    drawNeuralNetwork();
    generateRandomData();
    document.getElementById('sortingSpeedSlider').value = 500;  // 초기 속도 설정
    // 기타 초기화 함수들...
}

// 페이지 로드 시 모든 기능 초기화
window.addEventListener('DOMContentLoaded', initializeAll);

// 퍼즐 게임
function setupPuzzle() {
    const container = document.getElementById('puzzleContainer');
    container.innerHTML = '';
    puzzleState.forEach((num, index) => {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        piece.textContent = num || '';
        piece.onclick = () => movePiece(index);
        container.appendChild(piece);
    });
    updatePuzzleDisplay();
}

function shufflePuzzle() {
    puzzleState = [1, 2, 3, 4, 5, 6, 7, 8, 0].sort(() => Math.random() - 0.5);
    moveCount = 0;
    updatePuzzleDisplay();
    document.getElementById('moveCount').textContent = `이동 횟수: ${moveCount}`;
}

function movePiece(index) {
    const zeroIndex = puzzleState.indexOf(0);
    if (isAdjacent(index, zeroIndex)) {
        [puzzleState[index], puzzleState[zeroIndex]] = [puzzleState[zeroIndex], puzzleState[index]];
        moveCount++;
        updatePuzzleDisplay();
        document.getElementById('moveCount').textContent = `이동 횟수: ${moveCount}`;
        if (isPuzzleSolved()) {
            alert('퍼즐을 완성했습니다!');
            updatePoints(10);
        }
    }
}

function isAdjacent(index1, index2) {
    const row1 = Math.floor(index1 / 3);
    const col1 = index1 % 3;
    const row2 = Math.floor(index2 / 3);
    const col2 = index2 % 3;
    return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
}

function updatePuzzleDisplay() {
    const pieces = document.querySelectorAll('.puzzle-piece');
    puzzleState.forEach((num, index) => {
        pieces[index].textContent = num || '';
    });
}

function isPuzzleSolved() {
    return puzzleState.every((num, index) => num === (index + 1) % 9);
}

// 초기화 함수
function initializeAll() {
    drawChart();
    generatePattern();
    initScatterPlot();
    setupPuzzle();
    document.getElementById('startVoiceRecognition').onclick = startVoiceRecognition;
    document.getElementById('startGAButton').onclick = startGeneticAlgorithm;
    setupImageClassification();
    generateRandomData();
    document.getElementById('generateDataBtn').addEventListener('click', generateRandomData);
    document.getElementById('startSortingBtn').addEventListener('click', startSorting);
    document.getElementById('stopSortingBtn').addEventListener('click', stopSorting);
    document.getElementById('sortingSpeedSlider').addEventListener('input', function() {
        changeSortingSpeed(this.value);
    });
    document.getElementById('userInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    addToChatHistory('Bot', '안녕하세요! 저는 AI 친구예요. 무엇을 도와드릴까요?\n(^_^)');
    updateChatDisplay();
}

// 페이지 로드 시 모든 기능 초기화
window.addEventListener('DOMContentLoaded', initializeAll);

// ... (이전 코드는 그대로 유지)

// 페이지 로드 시 모든 기능 초기화
window.addEventListener('DOMContentLoaded', initializeAll);

// CSS 스타일
const style = document.createElement('style');
style.textContent = `
    .classification-image {
        width: 150px;
        height: 150px;
        object-fit: cover;
        margin: 5px;
        cursor: pointer;
        transition: transform 0.3s ease;
    }
    .classification-image:hover {
        transform: scale(1.1);
    }
`;
document.head.appendChild(style);