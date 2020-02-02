// This file is over 700 lines long because I am lazy.  Have fun! :)

const PATHFINDER_CONSTANTS = Object.freeze({
    BASE: 'pathfinder',
    GRID: 'pathfinder-grid',
    UI: 'pathfinder-ui',
    GRID_ROW: 'pathfinder-row',
    GRID_ELEMENT: 'pathfinder-element',
    GRID_SELECTED: 'pathfinder-selected',
    GRID_START: 'pathfinder-type-start',
    GRID_START_VALUE: 'S',
    GRID_START_KEY: 's',
    GRID_DESTINATION: 'pathfinder-type-destination',
    GRID_DESTINATION_VALUE: 'D',
    GRID_DESTINATION_KEY: 'd',
    GRID_UNPASSABLE: 'pathfinder-type-unpassable',
    GRID_UNPASSABLE_VALUE: 'X',
    GRID_UNPASSABLE_KEY: 'x',
    GRID_NORMAL: 'pathfinder-type-normal',
    GRID_INITIAL_COST: 1,
    GRID_PATH: 'pathfinder-path',
    GRID_CANDIDATE: 'pathfinder-candidate',
    GRID_EXAMINED: 'pathfinder-examined',
    UI_XY_DISPLAY: 'pathfinder-xy-display',
    UI_CONTROLS: 'pathfinder-controls',
    UI_TYPE_MENU: 'pathfinder-type-menu',
    UI_MOVE_COST: 'pathfinder-move-cost',
    UI_ALGORITHM: 'pathfinder-algorithm',
    UI_START_PATH: 'pathfinder-start-path',
    UI_DRAW_SPEED: 'pathfinder-draw-speed',
    UI_DRAW_SPEED_DISPLAY: 'pathfinder-draw-speed-display',
    UI_DRAW_SPEED_DEFAULT: 10,
    UI_DRAW_SPEED_MIN: 10,
    UI_DRAW_SPEED_MAX: 2000,
    UI_COST_DISPLAY: 'pathfinder-cost-display',
    ALGO_A_STAR: 'pathfinder-a-star',
    ALGO_DIJKSTRAS: 'pathfinder-dijkstras',
    ALGO_GREEDY_BEST_FIRST: 'pathfinder-greedy-best-first',
    CSS_HIDDEN: 'pathfinder-hidden'
});

const gridData = { width: null, height: null };

const initializePathfinder = () => {
    const pathfinderDiv = document.getElementById(PATHFINDER_CONSTANTS.BASE);

    const grid = document.createElement('div');
    grid.id = PATHFINDER_CONSTANTS.GRID;
    const ui = document.createElement('div');
    ui.id = PATHFINDER_CONSTANTS.UI;

    pathfinderDiv.appendChild(grid);
    pathfinderDiv.appendChild(ui);
};

const convertCoordinatesToIndex = (x, y) => x + (y * gridData.width);

const getIdOfElementFromIndex = (index) => `${PATHFINDER_CONSTANTS.GRID_ELEMENT}-${index}`;

const getIdOfElementFromCoordinates = (x, y) => getIdOfElementFromIndex(convertCoordinatesToIndex(x, y));

const getGridElementFromCoordinates = (x, y) => document.getElementById(getIdOfElementFromCoordinates(x, y));

const getPosFromElement = (element) => {
    const x = element.getAttribute("xpos");
    const y = element.getAttribute("ypos");

    return {
        x: parseInt(x),
        y: parseInt(y)
    };
}

const getStart = () => document.getElementsByClassName(PATHFINDER_CONSTANTS.GRID_START)[0];
const getEnd = () => document.getElementsByClassName(PATHFINDER_CONSTANTS.GRID_DESTINATION)[0];

const getDrawSpeed = () => {
    const delay = document.getElementsByName(PATHFINDER_CONSTANTS.UI_DRAW_SPEED)[0];
    return delay.value;
};

const createGrid = (width, height) => {
    const grid = document.getElementById(PATHFINDER_CONSTANTS.GRID);

    let index = 0;
    for (let i = 0; i < height; i++) {
        const row = document.createElement('div');
        row.classList.add(PATHFINDER_CONSTANTS.GRID_ROW);

        for (let j = 0; j < width; j++) {
            const element = document.createElement('div');
            element.id = getIdOfElementFromIndex(index);
            element.classList.add(PATHFINDER_CONSTANTS.GRID_ELEMENT);
            element.innerHTML = `${PATHFINDER_CONSTANTS.GRID_INITIAL_COST}`;
            element.setAttribute('xpos', `${j}`);
            element.setAttribute('ypos', `${i}`);
            element.onclick = clickElement;

            row.appendChild(element);

            index++;
        }

        grid.appendChild(row);
    }

    gridData.width = width;
    gridData.height = height;
};

const typeMenuData = [
    { text: 'Normal', value: PATHFINDER_CONSTANTS.GRID_NORMAL },
    { text: 'Unpassable', value: PATHFINDER_CONSTANTS.GRID_UNPASSABLE },
    { text: 'Start', value: PATHFINDER_CONSTANTS.GRID_START },
    { text: 'Destination', value: PATHFINDER_CONSTANTS.GRID_DESTINATION }
];

const createTypeMenu = () => {
    const typeMenuDiv = document.createElement('div');

    const typeLabel = document.createElement('label');
    typeLabel.innerHTML = 'Cell Type:';
    typeLabel.setAttribute('for', PATHFINDER_CONSTANTS.UI_TYPE_MENU);
    typeMenuDiv.appendChild(typeLabel);

    const typeMenu = document.createElement('select');
    typeMenu.name = PATHFINDER_CONSTANTS.UI_TYPE_MENU;
    typeMenu.disabled = true;
    typeMenu.onchange = changeType;

    typeMenuData.forEach((val, i) => {
        const option = document.createElement('option');
        option.innerHTML = val.text
        option.value = val.value;
        typeMenu.appendChild(option);
    });

    typeMenuDiv.appendChild(typeMenu);

    window.onkeydown = (event) => {
        const key = event.key;

        const selectedElement = document.getElementsByClassName(PATHFINDER_CONSTANTS.GRID_SELECTED)[0];
        if (!selectedElement) {
            return;
        }

        if (key === PATHFINDER_CONSTANTS.GRID_START_KEY) {
            typeMenu.value = PATHFINDER_CONSTANTS.GRID_START;
            changeType({ target: { value: PATHFINDER_CONSTANTS.GRID_START } });

        } else if (key === PATHFINDER_CONSTANTS.GRID_DESTINATION_KEY) {
            typeMenu.value = PATHFINDER_CONSTANTS.GRID_DESTINATION;
            changeType({ target: { value: PATHFINDER_CONSTANTS.GRID_DESTINATION } });

        } else if (key === PATHFINDER_CONSTANTS.GRID_UNPASSABLE_KEY) {
            typeMenu.value = PATHFINDER_CONSTANTS.GRID_UNPASSABLE
            changeType({ target: { value: PATHFINDER_CONSTANTS.GRID_UNPASSABLE } });
        }
    }

    return typeMenuDiv;
};

const createMoveCostSpinner = () => {
    const moveCostDiv = document.createElement('div');
    moveCostDiv.classList.add(PATHFINDER_CONSTANTS.CSS_HIDDEN);

    const moveCostLabel = document.createElement('label');
    moveCostLabel.innerHTML = 'Movement Cost:';
    moveCostLabel.setAttribute('for', PATHFINDER_CONSTANTS.UI_MOVE_COST);
    moveCostDiv.appendChild(moveCostLabel);

    const moveCostInput = document.createElement('input');
    moveCostInput.type = 'number';
    moveCostInput.min = 0;
    moveCostInput.step = 1;
    moveCostInput.value = 1;
    moveCostInput.name = PATHFINDER_CONSTANTS.UI_MOVE_COST;
    moveCostInput.disabled = true;
    moveCostInput.onchange = changeMoveCost;

    moveCostDiv.appendChild(moveCostInput);

    return moveCostDiv;
};

const getSelectedAlgorithm = () => {
    const selectedAlgorithm = document.getElementsByName(PATHFINDER_CONSTANTS.UI_ALGORITHM)[0];
    return selectedAlgorithm.value;
}

const algoOptions = [
    { text: 'A*', value: PATHFINDER_CONSTANTS.ALGO_A_STAR },
    { text: 'Dijkstra\'s', value: PATHFINDER_CONSTANTS.ALGO_DIJKSTRAS },
    { text: 'Greedy-Best-First', value: PATHFINDER_CONSTANTS.ALGO_GREEDY_BEST_FIRST }
]

const createPathControls = () => {
    const pathControlsDiv = document.createElement('div');

    const algoSelectLabel = document.createElement('label');
    algoSelectLabel.innerHTML = 'Algorithm:';
    algoSelectLabel.setAttribute('for', PATHFINDER_CONSTANTS.UI_ALGORITHM);
    pathControlsDiv.appendChild(algoSelectLabel);

    const algoSelect = document.createElement('select');
    algoSelect.name = PATHFINDER_CONSTANTS.UI_ALGORITHM;

    algoOptions.forEach((val, i) => {
        const option = document.createElement('option');
        option.innerHTML = val.text
        option.value = val.value;
        algoSelect.appendChild(option);
    });

    pathControlsDiv.appendChild(algoSelect);

    const startPathInput = document.createElement('input');
    startPathInput.type = 'button';
    startPathInput.value = 'Calculate Path';
    startPathInput.id = PATHFINDER_CONSTANTS.UI_START_PATH;
    startPathInput.onclick = findPath;

    pathControlsDiv.appendChild(startPathInput);

    const clearPathInput = document.createElement('input');
    clearPathInput.type = 'button';
    clearPathInput.value = 'Clear Path';
    clearPathInput.onclick = clearPath;

    pathControlsDiv.appendChild(clearPathInput);

    const drawSpeedLabel = document.createElement('label');
    drawSpeedLabel.innerHTML = 'Draw Speed:';
    drawSpeedLabel.setAttribute('for', PATHFINDER_CONSTANTS.UI_DRAW_SPEED);

    const drawSpeedAmount = document.createElement('span');
    drawSpeedAmount.id = PATHFINDER_CONSTANTS.UI_DRAW_SPEED_DISPLAY;
    drawSpeedAmount.innerHTML = `${PATHFINDER_CONSTANTS.UI_DRAW_SPEED_DEFAULT}`;

    drawSpeedLabel.appendChild(drawSpeedAmount);
    pathControlsDiv.appendChild(drawSpeedLabel);

    const drawSpeed = document.createElement('input');
    drawSpeed.name = PATHFINDER_CONSTANTS.UI_DRAW_SPEED;
    drawSpeed.type = 'range';
    drawSpeed.min = PATHFINDER_CONSTANTS.UI_DRAW_SPEED_MIN;
    drawSpeed.max = PATHFINDER_CONSTANTS.UI_DRAW_SPEED_MAX;
    drawSpeed.step = 10;
    drawSpeed.value = PATHFINDER_CONSTANTS.UI_DRAW_SPEED_DEFAULT;
    drawSpeed.onchange = changeDrawSpeed;
    drawSpeed.oninput = changeDrawSpeed;

    pathControlsDiv.appendChild(drawSpeed);

    return pathControlsDiv;
};

const createUi = () => {
    const ui = document.getElementById(PATHFINDER_CONSTANTS.UI);

    const controlsDisplay = document.createElement('div');
    controlsDisplay.id = PATHFINDER_CONSTANTS.UI_CONTROLS;
    controlsDisplay.classList.add(PATHFINDER_CONSTANTS.CSS_HIDDEN);

    const xyDisplay = document.createElement('div');
    xyDisplay.id = PATHFINDER_CONSTANTS.UI_XY_DISPLAY;
    controlsDisplay.appendChild(xyDisplay);

    const typeMenu = createTypeMenu();
    controlsDisplay.appendChild(typeMenu);

    const moveCost = createMoveCostSpinner();
    controlsDisplay.appendChild(moveCost);

    const pathControls = createPathControls();
    controlsDisplay.appendChild(pathControls);

    ui.appendChild(controlsDisplay);

    const resultDisplay = document.createElement('div');
    const costDisplay = document.createElement('div');
    costDisplay.id = PATHFINDER_CONSTANTS.UI_COST_DISPLAY;
    resultDisplay.appendChild(costDisplay);

    ui.appendChild(resultDisplay);
};

const clickElement = (event) => {
    const element = event.target;
    clearSelected();
    selectElement(element);
};

const selectElement = (element) => {
    element.classList.add(PATHFINDER_CONSTANTS.GRID_SELECTED);

    const xyDisplay = document.getElementById(PATHFINDER_CONSTANTS.UI_XY_DISPLAY);
    xyDisplay.innerHTML = `X: ${element.getAttribute('xpos')}, Y: ${element.getAttribute('ypos')}`;

    const controlsDisplay = document.getElementById(PATHFINDER_CONSTANTS.UI_CONTROLS);
    controlsDisplay.classList.remove(PATHFINDER_CONSTANTS.CSS_HIDDEN);

    enableTypeSelect();

    const cellText = element.innerHTML;

    if (cellText === PATHFINDER_CONSTANTS.GRID_UNPASSABLE_VALUE) {
        selectType(PATHFINDER_CONSTANTS.GRID_UNPASSABLE);
    } else if (cellText === PATHFINDER_CONSTANTS.GRID_START_VALUE) {
        selectType(PATHFINDER_CONSTANTS.GRID_START);
    } else if (cellText === PATHFINDER_CONSTANTS.GRID_DESTINATION_VALUE) {
        selectType(PATHFINDER_CONSTANTS.GRID_DESTINATION);
    } else {
        selectType(PATHFINDER_CONSTANTS.GRID_NORMAL);
        enableMoveCostInput();
        selectMoveCost(parseInt(cellText));
    }
};

const clearSelected = () => {
    const selectedElements = document.getElementsByClassName(PATHFINDER_CONSTANTS.GRID_SELECTED);

    for (let i = 0; i < selectedElements.length; i++) {
        selectedElements[i].classList.remove(PATHFINDER_CONSTANTS.GRID_SELECTED);
    }
};

const enableTypeSelect = () => {
    const typeSelect = document.getElementsByName(PATHFINDER_CONSTANTS.UI_TYPE_MENU)[0];
    typeSelect.disabled = false;
};

const enableMoveCostInput = () => {
    const moveCost = document.getElementsByName(PATHFINDER_CONSTANTS.UI_MOVE_COST)[0];

    moveCost.disabled = false;

    const moveCostDiv = moveCost.parentElement;
    moveCostDiv.classList.remove(PATHFINDER_CONSTANTS.CSS_HIDDEN);
};

const disableMoveCostInput = () => {
    const moveCost = document.getElementsByName(PATHFINDER_CONSTANTS.UI_MOVE_COST)[0];

    moveCost.disabled = false;

    const moveCostDiv = moveCost.parentElement;
    moveCostDiv.classList.add(PATHFINDER_CONSTANTS.CSS_HIDDEN);
};

const selectType = (type) => {
    const typeSelect = document.getElementsByName(PATHFINDER_CONSTANTS.UI_TYPE_MENU)[0];

    let selectedIndex = 0;
    typeMenuData.forEach((tm, i) => {
        if (tm.value === type) {
            selectedIndex = i;
            return;
        }
    });

    typeSelect.selectedIndex = selectedIndex;
};

const selectMoveCost = (movementCost) => {
    const moveCost = document.getElementsByName(PATHFINDER_CONSTANTS.UI_MOVE_COST)[0];
    moveCost.value = movementCost;
};

const changeType = (event) => {
    const selectedType = event.target.value;

    let value = '';

    if (selectedType === PATHFINDER_CONSTANTS.GRID_NORMAL) {
        enableMoveCostInput();
        value = PATHFINDER_CONSTANTS.GRID_INITIAL_COST;
        selectMoveCost(value);
        clearTypesFromSelectedClass();
        addSelectedElementClass(PATHFINDER_CONSTANTS.GRID_NORMAL);

    } else {
        disableMoveCostInput();

        if (selectedType === PATHFINDER_CONSTANTS.GRID_START) {
            value = PATHFINDER_CONSTANTS.GRID_START_VALUE;
            clearTypesFromSelectedClass();
            clearStartLocation();
            addSelectedElementClass(PATHFINDER_CONSTANTS.GRID_START);

        } else if (selectedType === PATHFINDER_CONSTANTS.GRID_DESTINATION) {
            value = PATHFINDER_CONSTANTS.GRID_DESTINATION_VALUE;
            clearTypesFromSelectedClass();
            clearDestination();
            addSelectedElementClass(PATHFINDER_CONSTANTS.GRID_DESTINATION);

        } else if (selectedType === PATHFINDER_CONSTANTS.GRID_UNPASSABLE) {
            clearTypesFromSelectedClass();
            value = PATHFINDER_CONSTANTS.GRID_UNPASSABLE_VALUE;
            addSelectedElementClass(PATHFINDER_CONSTANTS.GRID_UNPASSABLE);
        }
    }

    setSelectedElementValue(`${value}`);
};

const changeMoveCost = (event) => {
    const newValue = event.target.value;
    setSelectedElementValue(newValue);
};

const changeDrawSpeed = (event) => {
    const newValue = event.target.value;
    const speedDisplay = document.getElementById(PATHFINDER_CONSTANTS.UI_DRAW_SPEED_DISPLAY);
    speedDisplay.innerHTML = `${newValue}`;
};

const setSelectedElementValue = (value) => {
    const selectedElement = document.getElementsByClassName(PATHFINDER_CONSTANTS.GRID_SELECTED)[0];

    selectedElement.innerHTML = value;
};

const addSelectedElementClass = (cls) => {
    const selectedElement = document.getElementsByClassName(PATHFINDER_CONSTANTS.GRID_SELECTED)[0];
    selectedElement.classList.add(cls);
};

const removeSelectedElementClass = (cls) => {
    const selectedElement = document.getElementsByClassName(PATHFINDER_CONSTANTS.GRID_SELECTED)[0];
    selectedElement.classList.remove(cls);
};

const clearStartLocation = () => {
    const startLocations = document.getElementsByClassName(PATHFINDER_CONSTANTS.GRID_START);

    for (let i = 0; i < startLocations.length; i++) {
        startLocations[i].innerHTML = PATHFINDER_CONSTANTS.GRID_INITIAL_COST;
        startLocations[i].classList.remove(PATHFINDER_CONSTANTS.GRID_START);
    }
}

const clearDestination = () => {
    const destinations = document.getElementsByClassName(PATHFINDER_CONSTANTS.GRID_DESTINATION);

    for (let i = 0; i < destinations.length; i++) {
        destinations[i].innerHTML = PATHFINDER_CONSTANTS.GRID_INITIAL_COST;
        destinations[i].classList.remove(PATHFINDER_CONSTANTS.GRID_DESTINATION);
    }
}

const clearTypesFromSelectedClass = () => {
    removeSelectedElementClass(PATHFINDER_CONSTANTS.GRID_NORMAL);
    removeSelectedElementClass(PATHFINDER_CONSTANTS.GRID_START);
    removeSelectedElementClass(PATHFINDER_CONSTANTS.GRID_DESTINATION);
    removeSelectedElementClass(PATHFINDER_CONSTANTS.GRID_UNPASSABLE);
}

const sqrt2 = Math.sqrt(2);

const diagonalMovableHeuristic = (a, b) => {
    const aPos = getPosFromElement(a);
    const bPos = getPosFromElement(b);

    const dx = Math.abs(bPos.x - aPos.x);
    const dy = Math.abs(bPos.y - aPos.y);

    const d1 = 1;
    const d2 = sqrt2;

    return d1 * (dx + dy) + (d2 - 2 * d1) * Math.min(dx, dy);
};

const aStar = async (start, end, h = diagonalMovableHeuristic, f = (h, g) => h + g) => {
    const drawSpeedDelay = getDrawSpeed();

    const openSet = {};
    const closedSet = {};

    const createSetEntry = (position, g = Infinity, h = 0, previous = null) => {
        return {
            id: position.id,
            position,
            previous,
            g,
            h,
            f: f(h, g)
        };
    }

    const addToOpenSet = (setEntry) => {
        openSet[setEntry.id] = setEntry;
    };

    const addToClosedSet = (setEntry) => {
        closedSet[setEntry.id] = setEntry;
    }

    const findLowestFScoreInOpenSet = () => {
        let fMin = Infinity;
        let result = null;

        for (pid in openSet) {
            let p = openSet[pid];
            let f = p.f;
            if (f < fMin) {
                fMin = f;
                result = p.id;
            }
        }

        return result;
    }

    const buildPath = (finalPosition) => {
        const path = [];

        let current = finalPosition;
        while (current) {
            path.push(current);
            current = current.previous;
        }

        return path;
    }

    addToOpenSet(createSetEntry(start, 0, h(start, end)));

    while (!(Object.keys(openSet).length === 0 && openSet.constructor === Object)) {
        const cid = findLowestFScoreInOpenSet();
        const current = openSet[cid];

        if (cid === end.id) {
            return buildPath(current);
        }

        delete openSet[cid];

        current.position.classList.add(PATHFINDER_CONSTANTS.GRID_EXAMINED);
        await sleep(drawSpeedDelay);

        const currentPos = getPosFromElement(current.position);

        const neighbors = [];
        for (let yy = -1; yy < 2; yy++) {
            const yPos = currentPos.y + yy;
            if (yPos < 0 || yPos >= gridData.height) {
                continue;
            }
            for (let xx = -1; xx < 2; xx++) {
                const xPos = currentPos.x + xx;
                if (xPos < 0 || xPos >= gridData.width) {
                    continue;
                }

                if (!(xx === 0 && yy === 0)) {
                    // Check all 8 neighbors
                    const neighbor = getGridElementFromCoordinates(xPos, yPos);
                    const diagonal = xx !== 0 && yy !== 0;

                    neighborValue = neighbor.innerHTML;
                    if (neighborValue === PATHFINDER_CONSTANTS.GRID_UNPASSABLE_VALUE || neighbor.id === current.position.id) {
                        // Skip impassable terrain or backtracking paths
                        continue;
                    }

                    if (neighbor.id === end.id) {
                        // Path found!
                        return buildPath(createSetEntry(neighbor, 0, 0, current));
                    }

                    const moveCost = parseInt(neighborValue);
                    const gVal = current.g + moveCost * (diagonal ? sqrt2 : 1);
                    const hVal = h(neighbor, end);

                    const entry = createSetEntry(neighbor, gVal, hVal, current);

                    if (neighbors.length === 0 || entry.g >= neighbors[neighbors.length - 1].g) {
                        neighbors.push(entry);
                    } else {
                        neighbors.unshift(entry)
                    }
                }
            }
        }

        for (let i = 0; i < neighbors.length; i++) {
            const entry = neighbors[i];
            const neighbor = entry.position;

            if (openSet.hasOwnProperty(entry.id) && openSet[entry.id].g < entry.g) {
                continue;
            }

            if (closedSet.hasOwnProperty(entry.id)) {
                continue;
            }

            if (!open.hasOwnProperty(entry.id) && !closedSet.hasOwnProperty(entry.id)) {
                neighbor.classList.add(PATHFINDER_CONSTANTS.GRID_CANDIDATE);
                addToOpenSet(entry);
                await sleep(drawSpeedDelay);
            }
        }

        addToClosedSet(current);
    }

    return null;
}

const dijkstras = async (start, end) => {
    return await aStar(start, end, (a, b) => 0);
}

const greedyBestFirst = async (start, end) => {
    return await aStar(start, end, diagonalMovableHeuristic, (h, g) => h);
}

const illustratePath = async (path, executionTime) => {
    const drawSpeedDelay = getDrawSpeed();

    await path.forEach(async cell => {
        if (cell) {
            cell.position.classList.add(PATHFINDER_CONSTANTS.GRID_PATH);
            await sleep(drawSpeedDelay);
        }
    });

    const costDisplay = document.getElementById(PATHFINDER_CONSTANTS.UI_COST_DISPLAY);
    costDisplay.innerHTML = `Cost: ${path[1].g.toFixed(2)}, Steps: ${path.length - 1}, Time: ${(executionTime / 1000).toFixed(2)} s`;
}

const findPath = async () => {
    const timeStart = Date.now();

    const start = getStart();
    const end = getEnd();

    if (!start || !end) {
        console.log('Both a start and end must be defined!');
        return;
    }

    clearPath();

    const selectedAlgorithm = getSelectedAlgorithm();

    let path = [];
    if (selectedAlgorithm === PATHFINDER_CONSTANTS.ALGO_A_STAR) {
        path = await aStar(start, end);
    } else if (selectedAlgorithm === PATHFINDER_CONSTANTS.ALGO_DIJKSTRAS) {
        path = await dijkstras(start, end);
    } else if (selectedAlgorithm === PATHFINDER_CONSTANTS.ALGO_GREEDY_BEST_FIRST) {
        path = await greedyBestFirst(start, end);
    }



    if (!path) {
        console.log('No path was found!');
        return;
    }

    const timeEnd = Date.now();

    await illustratePath(path, timeEnd - timeStart);
}

const clearPath = () => {
    const path = document.getElementsByClassName(PATHFINDER_CONSTANTS.GRID_PATH);

    while (path.length > 0) {
        path[0].classList.remove(PATHFINDER_CONSTANTS.GRID_PATH);
    }

    const candidates = document.getElementsByClassName(PATHFINDER_CONSTANTS.GRID_CANDIDATE);

    while (candidates.length > 0) {
        candidates[0].classList.remove(PATHFINDER_CONSTANTS.GRID_CANDIDATE);
    }

    clearCurrentCell();

    const costDisplay = document.getElementById(PATHFINDER_CONSTANTS.UI_COST_DISPLAY);
    costDisplay.innerHTML = '';
};

const clearCurrentCell = () => {
    const cell = document.getElementsByClassName(PATHFINDER_CONSTANTS.GRID_EXAMINED);

    while (cell.length > 0) {
        cell[0].classList.remove(PATHFINDER_CONSTANTS.GRID_EXAMINED);
    }
}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.onload = () => {
    initializePathfinder();
    createGrid(20, 20);
    createUi();
}
