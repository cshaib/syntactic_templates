document.addEventListener('DOMContentLoaded', initializeTemplateMatcher);

function initializeTemplateMatcher() {
    const datasets = ['Rotten_Tomatoes', 'CNN_DailyMail', 'Cochrane'];
    const models = ['Llama-2-70B', 'GPT4-o', 'Llama-3-70B', 'OLMo-7B', 'Mistral-7B'];
    const datasetSelect = document.getElementById('dataset-select');
    const modelSelect = document.getElementById('model-select');
    const templateSelect = document.getElementById('template-select');
    const resultList = document.getElementById('result-list');
    let templateData = {};

    // Populate dropdowns
    populateDropdown(datasetSelect, datasets);
    populateDropdown(modelSelect, models);

    // Show static example
    showStaticExample();

    // Event listeners
    datasetSelect.addEventListener('change', checkAndLoadData);
    modelSelect.addEventListener('change', checkAndLoadData);
    templateSelect.addEventListener('change', displayResults);

    function populateDropdown(select, options) {
        select.innerHTML = '<option value="">Select an option</option>';
        options.forEach(option => {
            const el = document.createElement('option');
            el.textContent = el.value = option;
            select.appendChild(el);
        });
    }

    function showStaticExample() {
        templateSelect.innerHTML = '<option value="">Choose a template</option><option value="static">Example Template</option>';
        const staticTemplate = {
            template: "VBZ DT JJ CC JJ NN",
            text: [
                'reflects the understated but tremulous mood',
                "it's a disappointing and unfulfilling movie",
                'is a funny and entertaining watch.',
                'is a stylish and entertaining film,',
                'offers a nuanced and compassionate portrayal',
                'is a lighthearted and amusing film',
                'offers a nuanced and thoughtful exploration',
                'is a disappointing and confusing film',
                'promises a light-hearted and campy take',
                'is a well-made and thought-provoking film',
                'is a persuasive and stimulating work',
                'is a powerful and timely movie',
                'is a well-crafted and enjoyable entertainment',
                'is both entertaining and uncomfortably real.',
                'has both impressed and disappointed critics.',
                'remains a unique and entertaining experience',
                'is a thought-provoking and engaging movie',
                'offers a nuanced and empathetic portrayal',
                'is an entertaining but imperfect film,',
                'is a well-crafted and engaging film'
                // ... (truncated for brevity)
            ]
        };
        
        const formattedList = staticTemplate.text.map(text => `<li>${text}</li>`).join('');
        resultList.innerHTML = `
            <p><strong>Template:</strong> ${staticTemplate.template}</p>
            <p><strong>Matching Text:</strong></p>
            <ul>${formattedList}</ul>
        `;
    }

    function checkAndLoadData() {
        if (datasetSelect.value && modelSelect.value) {
            loadData();
        } else {
            showStaticExample();
        }
    }

    async function loadData() {
        const selectedDataset = datasetSelect.value;
        const selectedModel = modelSelect.value;
        console.log(`Loading data for ${selectedModel} and ${selectedDataset}`);
        
        try {
            const url = `data/templates_only/json/${selectedModel}_${selectedDataset}.jsonl`;
            console.log(`Fetching from URL: ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            console.log('Received data:', text.substring(0, 100) + '...'); // Log first 100 characters
            const lines = text.trim().split('\n');
            templateData = lines.map(line => JSON.parse(line));
            console.log('Parsed template data:', templateData);
            
            updateTemplateOptions();
        } catch (error) {
            console.error('Error loading data:', error);
            resultList.innerHTML = `<p class="text-danger">Error loading data: ${error.message}. Please try again.</p>`;
        }
    }

    function updateTemplateOptions() {
        console.log('Updating template options');
        templateSelect.innerHTML = '<option value="">Choose a template</option>';
        if (templateData.length === 0 || !Array.isArray(templateData[0])) {
            console.log('No valid template data available');
            resultList.innerHTML = '<p>No templates found for the selected model and dataset.</p>';
            return;
        }
        
        templateData[0].forEach((item, index) => {
            if (item && item.template) {
                const option = document.createElement('option');
                option.value = index; // Use the index as the value
                option.textContent = item.template;
                templateSelect.appendChild(option);
            }
        });
        
        console.log(`Added ${templateSelect.options.length - 1} template options`);
        resultList.innerHTML = '<p>Template options updated. Please select a template.</p>';
    }

    function displayResults() {
        const selectedIndex = templateSelect.value;
        console.log('Selected template index:', selectedIndex);
        if (selectedIndex === "") {
            resultList.innerHTML = '<p>Please select a template.</p>';
            return;
        }
        if (selectedIndex === "static") {
            resultList.innerHTML = '<p>This is a static example. Select a real template to see actual results.</p>';
            return;
        }
        const matchingItem = templateData[0][selectedIndex];
        if (!matchingItem) {
            resultList.innerHTML = '<p>No matching text found for the selected template.</p>';
            return;
        }
        
        // Improved regex to parse the Python-style list string
        const textList = matchingItem.text.match(/(?<=^|\s|,)'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g)
            .map(item => item.replace(/^['"]|['"]$/g, '').replace(/\\'/g, "'"));
        
        const formattedList = textList.map(text => `<li>${text}</li>`).join('');
        resultList.innerHTML = `<ul>${formattedList}</ul>`;
    }
}