function validateAndGetContents(rawContent) {
    const model = JSON.parse(rawContent);
    if (!Array.isArray(model) || model.length < 1) throw new Error();
    const sampleData = model[0];
    if (!sampleData.hasOwnProperty('id') || !Array.isArray(sampleData.instances)) throw new Error();
    const sampleInstance = sampleData.instances[0];
    if (!sampleInstance.hasOwnProperty('path') || !sampleInstance.hasOwnProperty('code')) throw new Error();

    return model;
}

function setupSimilarityDropdown(model) {
    const dropdown = document.getElementById('similarity-input-dropdown');
    let innerHtml = model.map((similarity, index) => {
        const {id, instances} = similarity;
        const matchCountText = `${instances.length} matches`;
        return `<option value="${id}" ${index === 0 ? 'selected' : ''}>${matchCountText}</option>`
    });
    setupInstancePickers(model[0].id);
    dropdown.innerHTML = innerHtml;
}

function updateDiffContent(contents, lines, path, isB = false) {
    let selector = isB ? 'b' : 'a';
    let el = document.getElementById(selector);
    el.textContent = contents;
    const metaElSelector = isB ? 'rightBlockMeta' : 'leftBlockMeta';
    const metaEl = document.getElementById(metaElSelector);
    metaEl.textContent = `lines: ${lines}`;
    const copyEl = document.getElementById(`${metaElSelector}Copy`);
    copyEl.style.display = 'inline';
    const windowVarName = isB ? 'rightBlockFileLoc' : 'leftBlockFileLoc';
    window[windowVarName] = path.replace('./', '').concat(`:${lines[0]}`);
}

function setupInstancePickers(similarityId) {
    const similarity = model.find(({id}) => id === similarityId);
    window.selectedSimilarity = similarity;
    let dropdownA = document.getElementById('leftBlockInputDropdown');
    let dropdownB = document.getElementById('rightBlockInputDropdown');
    let getMarkupMapper = isB => (instance, index) => {
        const {path, code} = instance;
        const indexToPick = isB ? 1 : 0;
        return `<option value="${path}" ${index === indexToPick ? 'selected' : ''}>${path}</option>`
    }
    let dropdownAHtml = similarity.instances.map(getMarkupMapper(false));
    let dropdownBHtml = similarity.instances.map(getMarkupMapper(true));
    dropdownA.innerHTML = dropdownAHtml;
    dropdownB.innerHTML = dropdownBHtml;
    updateDiffContent(similarity.instances[0].code, similarity.instances[0].lines, similarity.instances[0].path);
    updateDiffContent(similarity.instances[1].code, similarity.instances[1].lines, similarity.instances[1].path, true);
    changed();
}

function handleSimilaritySelect(event) {
    const selectedId = event.target.value;
    setupInstancePickers(selectedId);
}

function getCodeBlockSelectHandler(isB = false) {
    return function (event) {
        const {code, lines, path} = selectedSimilarity.instances.find(({path}) => path === event.target.value);
        updateDiffContent(code, lines, path, isB);
        changed();
    }
}

(function () {
    const dropdownElement = document.getElementById('similarity-input-dropdown');
    const leftBlockElement = document.getElementById('leftBlockInputDropdown');
    const rightBlockElement = document.getElementById('rightBlockInputDropdown');
    [leftBlockElement, rightBlockElement].map((el, index) => {
        el.addEventListener('change', getCodeBlockSelectHandler(index === 1));
    })
    dropdownElement.addEventListener('change', handleSimilaritySelect)
})();

function onFileRead(rawContent) {
    try {
        window.model = validateAndGetContents(rawContent);
        setupSimilarityDropdown(model);
    } catch (ex) {
        console.error(ex);
        alert('invalid json');
    }
}

function handleFileSelect (e) {
    var files = e.target.files;
    if (files.length < 1) {
        alert('select a file...');
        return;
    }
    var file = files[0];
    var reader = new FileReader();
    reader.onload = () => {
        onFileRead(reader.result);
    };
    reader.readAsText(file);
}

function listenToCopyButtons() {
    const leftElCopy = document.getElementById('leftBlockMetaCopy');
    const rightElCopy = document.getElementById('rightBlockMetaCopy');
    function getListener(isRight) {
        return function (event) {
            const content = isRight ? window.rightBlockFileLoc : window.leftBlockFileLoc;
            navigator.clipboard.writeText(content).then(function() {
                console.log('Async: Copying to clipboard was successful!');
              }, function(err) {
                console.error('Async: Could not copy text: ', err);
              });
        }
    }
    leftElCopy.addEventListener('click', getListener(false));
    rightElCopy.addEventListener('click', getListener(true));
}

(function () {
    const importFileButton = document.getElementById('import-file-button');
    const fileInput = document.getElementById('file-input-json');
    importFileButton.addEventListener('click', function () {
        fileInput.click();
    });
    fileInput.addEventListener('change', handleFileSelect);
    listenToCopyButtons();
})();


// Diff code starts here.
var a = document.getElementById('a');
var b = document.getElementById('b');
var result = document.getElementById('result');

function changed() {
	var diff = JsDiff[window.diffType || 'diffWords'](a.textContent, b.textContent);
	var fragment = document.createDocumentFragment();
	for (var i=0; i < diff.length; i++) {

		if (diff[i].added && diff[i + 1] && diff[i + 1].removed) {
			var swap = diff[i];
			diff[i] = diff[i + 1];
			diff[i + 1] = swap;
		}

		var node;
		if (diff[i].removed) {
			node = document.createElement('del');
			node.appendChild(document.createTextNode(diff[i].value));
		} else if (diff[i].added) {
			node = document.createElement('ins');
			node.appendChild(document.createTextNode(diff[i].value));
		} else {
			node = document.createTextNode(diff[i].value);
		}
		fragment.appendChild(node);
	}

	result.textContent = '';
	result.appendChild(fragment);
}

window.onload = function() {
	onDiffTypeChange(document.querySelector('#settings [name="diff_type"]:checked'));
	changed();
};

a.onpaste = a.onchange =
b.onpaste = b.onchange = changed;

if ('oninput' in a) {
	a.oninput = b.oninput = changed;
} else {
	a.onkeyup = b.onkeyup = changed;
}

function onDiffTypeChange(radio) {
	window.diffType = radio.value;
	document.title = "Diff " + radio.value.slice(4);
}

var radio = document.getElementsByName('diff_type');
for (var i = 0; i < radio.length; i++) {
	radio[i].onchange = function(e) {
		onDiffTypeChange(e.target);
		changed();
	}
}