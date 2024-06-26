let points = 0;
let dataChart, scatterChart;
let currentPattern = [];
let currentPatternAnswer;
const scatterData = [];
let gaInterval;

function updatePoints(amount) {
    points += amount;
    document.getElementById('pointsDisplay').textContent = `포인트: ${points}`;
}

// 데이터 시각화
function drawChart() {
    const ctx = document.getElementById('dataChart').getContext('2d');
    const chartType = document.getElementById('chartType').value;
    const data = [
        document.getElementById('data1').value,
        document.getElementById('data2').value,
        document.getElementById('data3').value,
        document.getElementById('data4').value,
        document.getElementById('data5').value
    ].map(Number);

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

// 패턴 인식
function generatePattern() {
    const difficulty = document.getElementById('difficultyLevel').value;
    let pattern = [];
    let rule;

    switch(difficulty) {
        case 'easy':
            rule = Math.floor(Math.random() * 5) + 1;
            for (let i = 0; i < 5; i++) {
                pattern.push(i * rule);
            }
            currentPatternAnswer = pattern[4] + rule;
            break;
        case 'medium':
            rule = Math.floor(Math.random() * 3) + 2;
            for (let i = 0; i < 5; i++) {
                pattern.push(Math.pow(rule, i));
            }
            currentPatternAnswer = Math.pow(rule, 5);
            break;
        case 'hard':
            for (let i = 0; i < 5; i++) {
                pattern.push(Math.floor(Math.random() * 10));
            }
            rule = (pattern[4] - pattern[3]) + (pattern[3] - pattern[2]);
            currentPatternAnswer = pattern[4] + rule;
            break;
    }

    currentPattern = pattern;
    document.getElementById('patternDisplay').textContent = pattern.join(', ') + ', ?';
}

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

// 선형 회귀
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
            }
        }
    });
}

function drawRegressionLine() {
    if (scatterData.length < 2) {
        alert('점을 최소 2개 이상 찍어주세요.');
        return;
    }

    const n = scatterData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let point of scatterData) {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumX2 += point.x * point.x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const minX = Math.min(...scatterData.map(p => p.x));
    const maxX = Math.max(...scatterData.map(p => p.x));

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
    updatePoints(3);
}

// 신경망 시각화
function drawNeuralNetwork() {
    const canvas = document.getElementById('networkCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const layers = [3, 4, 4, 2];
    const layerDistance = canvas.width / (layers.length + 1);
    const nodeRadius = 15;

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
        }
    }

    // 연결선 그리기
    for (let i = 0; i < layers.length - 1; i++) {
        for (let j = 0; j < layers[i]; j++) {
            for (let k = 0; k < layers[i + 1]; k++) {
                const x1 = (i + 1) * layerDistance;
                const y1 = (canvas.height / (layers[i] + 1)) * (j + 1);
                const x2 = (i + 2) * layerDistance;
                const y2 = (canvas.height / (layers[i + 1] + 1)) * (k + 1);
                ctx.beginPath();
                ctx.moveTo(x1 + nodeRadius, y1);
                ctx.lineTo(x2 - nodeRadius, y2);
                ctx.stroke();
            }
        }
    }

    updatePoints(2);
}

// 이미지 분류 시뮬레이션
function setupImageClassification() {
    const imageContainer = document.getElementById('imageContainer');
    const img = document.createElement('img');
    img.src = 'https://www.tensorflow.org/static/tutorials/images/classification_files/output_wBmEA9c0JYes_0.png?hl=ko';
    img.alt = 'TensorFlow Image Classification Example';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    
    img.onerror = function() {
        imageContainer.textContent = '이미지를 불러오는 데 실패했습니다.';
    };

    img.onload = function() {
        imageContainer.appendChild(img);
        img.onclick = function() {
            const possibleClasses = ['선인장', '꽃', '나무', '산'];
            const randomClass = possibleClasses[Math.floor(Math.random() * possibleClasses.length)];
            const confidence = (Math.random() * 30 + 70).toFixed(2);
            document.getElementById('classificationResult').textContent = `AI의 추측: ${randomClass} (확률: ${confidence}%)`;
            updatePoints(3);
        };
    };
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
let sortingArray = [];

function generateRandomData() {
    sortingArray = Array.from({length: 10}, () => Math.floor(Math.random() * 100) + 1);
    visualizeSortingArray();
}

function visualizeSortingArray() {
    const container = document.getElementById('sortingVisualization');
    container.innerHTML = '';
    sortingArray.forEach(value => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${value * 2}px`;
        container.appendChild(bar);
    });
}

async function startSorting() {
    for (let i = 0; i < sortingArray.length; i++) {
        for (let j = 0; j < sortingArray.length - i - 1; j++) {
            if (sortingArray[j] > sortingArray[j + 1]) {
                [sortingArray[j], sortingArray[j + 1]] = [sortingArray[j + 1], sortingArray[j]];
                visualizeSortingArray();
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }
    updatePoints(5);
}

// 유전 알고리즘 시뮬레이션
let targetString = "Hello, World!";
let populationSize = 100;
let mutationRate = 0.01;

function startGeneticAlgorithm() {
    document.getElementById('targetString').textContent = targetString;
    let population = initializePopulation();
    let generation = 0;
    const gaResultElement = document.getElementById('gaResult');

    gaInterval = setInterval(() => {
        population = evolve(population);
        const bestIndividual = population[0];
        gaResultElement.innerHTML = `
            세대: ${generation}<br>
            최적 해: ${bestIndividual}<br>
            적합도: ${calculateFitness(bestIndividual)}/${targetString.length}
        `;
        if (bestIndividual === targetString) {
            clearInterval(gaInterval);
            gaResultElement.innerHTML += '<br>목표 달성!';
            updatePoints(10);
        }
        generation++;
    }, 100);
}

function initializePopulation() {
    return Array.from({length: populationSize}, () => 
        Array.from({length: targetString.length}, () => 
            String.fromCharCode(Math.floor(Math.random() * 95) + 32)
        ).join('')
    );
}

function calculateFitness(individual) {
    return individual.split('').filter((char, i) => char === targetString[i]).length;
}

function evolve(population) {
    const newPopulation = [];
    while (newPopulation.length < populationSize) {
        const parent1 = selectParent(population);
        const parent2 = selectParent(population);
        let child = crossover(parent1, parent2);
        child = mutate(child);
        newPopulation.push(child);
    }
    return newPopulation.sort((a, b) => calculateFitness(b) - calculateFitness(a));
}

function selectParent(population) {
    const tournamentSize = 5;
    const tournament = Array.from({length: tournamentSize}, () => 
        population[Math.floor(Math.random() * population.length)]
    );
    return tournament.reduce((best, current) => 
        calculateFitness(current) > calculateFitness(best) ? current : best
    );
}

function crossover(parent1, parent2) {
    const midpoint = Math.floor(parent1.length / 2);
    return parent1.slice(0, midpoint) + parent2.slice(midpoint);
}

function mutate(individual) {
    return individual.split('').map(char => 
        Math.random() < mutationRate ? String.fromCharCode(Math.floor(Math.random() * 95) + 32) : char
    ).join('');
}

// 퍼즐 게임
let puzzleState = [1, 2, 3, 4, 5, 6, 7, 8, 0];
let moveCount = 0;

function setupPuzzle() {
    const container = document.getElementById('puzzleContainer');
    container.innerHTML = ''; // Clear existing pieces
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
}

// 페이지 로드 시 모든 기능 초기화
window.onload = initializeAll;