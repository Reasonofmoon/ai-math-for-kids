// 신경망 시각화
function drawNeuralNetwork() {
    const canvas = document.getElementById('networkCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const layers = [3, 4, 4, 2];
    const layerDistance = canvas.width / (layers.length + 1);
    const nodeRadius = 15;

    for (let i = 0; i < layers.length; i++) {
        const layerSize = layers[i];
        const layerX = (i + 1) * layerDistance;
        const nodeDistance = canvas.height / (layerSize + 1);

        for (let j = 0; j < layerSize; j++) {
            const nodeY = (j + 1) * nodeDistance;
            
            // Draw node
            ctx.beginPath();
            ctx.arc(layerX, nodeY, nodeRadius, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.stroke();

            // Draw connections to next layer
            if (i < layers.length - 1) {
                const nextLayerSize = layers[i + 1];
                const nextLayerX = (i + 2) * layerDistance;
                const nextNodeDistance = canvas.height / (nextLayerSize + 1);

                for (let k = 0; k < nextLayerSize; k++) {
                    const nextNodeY = (k + 1) * nextNodeDistance;
                    ctx.beginPath();
                    ctx.moveTo(layerX + nodeRadius, nodeY);
                    ctx.lineTo(nextLayerX - nodeRadius, nextNodeY);
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                    ctx.stroke();
                }
            }
        }
    }
    updatePoints(2);
}