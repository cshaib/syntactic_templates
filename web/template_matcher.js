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

    // Event listeners
    datasetSelect.addEventListener('change', loadData);
    modelSelect.addEventListener('change', loadData);
    templateSelect.addEventListener('change', displayResults);

    function populateDropdown(select, options) {
        select.innerHTML = '';
        options.forEach(option => {
            const el = document.createElement('option');
            el.textContent = el.value = option;
            select.appendChild(el);
        });
    }

    async function loadData() {
        const selectedDataset = datasetSelect.value;
        const selectedModel = modelSelect.value;
        
        try {
            const response = await fetch(`data/templates_only/json/${selectedModel}_${selectedDataset}.jsonl`);
            const text = await response.text();
            const lines = text.trim().split('\n');
            templateData = lines.map(line => JSON.parse(line));
            
            updateTemplateOptions();
            displayResults();
        } catch (error) {
            console.error('Error loading data:', error);
            resultList.innerHTML = '<p class="text-danger">Error loading data. Please try again.</p>';
        }
    }

    function updateTemplateOptions() {
        templateSelect.innerHTML = '<option value="">Choose a template</option>';
        templateData.forEach(item => {
            const option = document.createElement('option');
            option.value = option.textContent = item.template;
            templateSelect.appendChild(option);
        });
    }

    function displayResults() {
        const selectedTemplate = templateSelect.value;
        if (!selectedTemplate) {
            resultList.innerHTML = '<p>Please select a template.</p>';
            return;
        }

        const matchingItem = templateData.find(item => item.template === selectedTemplate);
        if (!matchingItem) {
            resultList.innerHTML = '<p>No matching text found for the selected template.</p>';
            return;
        }

        const textList = JSON.parse(matchingItem.text.replace(/'/g, '"'));
        const formattedList = textList.map(text => `<li>${text}</li>`).join('');
        resultList.innerHTML = `<ul>${formattedList}</ul>`;
    }

    // Initial load
    loadData();
}