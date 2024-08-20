function initializeTemplateExplorer() {
  const datasets = ['Rotten_Tomatoes', 'CNN_DailyMail', 'Cochrane'];
  const models = ['Llama-2-70B', 'GPT4-o', 'Llama-3-70B', 'OLMo-7B', 'Mistral-7B'];

  const datasetSelect = document.getElementById('dataset-select');
  const modelSelect = document.getElementById('model-select');
  const templateLengthSelect = document.getElementById('template-length-select');
  const templateCheckboxes = document.getElementById('template-checkboxes');
  const outputContent = document.getElementById('output-content');
  const clearSelectionButton = document.getElementById('clear-selection');
  const selectAllSelectionButton = document.getElementById('all-selection');
  


  let currentData = null;
  let currentExampleIndex = 0;
  let templateColors = {};

  // Populate dropdowns
  populateDropdown(datasetSelect, datasets);
  populateDropdown(modelSelect, models);

  // Event listeners for dropdowns and button
  datasetSelect.addEventListener('change', loadData);
  modelSelect.addEventListener('change', loadData);
  templateLengthSelect.addEventListener('change', updateTemplateCheckboxes);
  clearSelectionButton.addEventListener('click', clearSelection);
  selectAllSelectionButton.addEventListener('click', allSelection)

  function populateDropdown(select, options) {
      select.innerHTML = '';
      options.forEach(option => {
          const el = document.createElement('option');
          el.textContent = el.value = option;
          select.appendChild(el);
      });
  }
  
let previousHues = [];

function generateUniqueColor() {
    const maxAttempts = 100;
    let attempts = 0;
    let hue;
    do {
        hue = Math.random() * 360;
        attempts++;
    } while (isHueTooClose(hue) && attempts < maxAttempts);
    if (attempts < maxAttempts) {
        previousHues.push(hue);
        return `hsl(${hue}, 90%, 80%)`;
    } else {
        // Fall back to a random color if a unique color couldn't be generated
        return `hsl(${Math.random() * 360}, 90%, 80%)`;
    }
}

function isHueTooClose(newHue) {
    const minDistance = 50; // Change this to increase or decrease the minimum distance between colors
    return previousHues.some(oldHue => Math.abs(newHue - oldHue) < minDistance);
}
  async function loadData() {
      const selectedDataset = datasetSelect.value;
      const selectedModel = modelSelect.value;
      
      try {
          const response = await fetch(`data/patterns_${selectedModel}_${selectedDataset}.jsonl`);
          const text = await response.text();
          const lines = text.trim().split('\n');
          currentData = lines.map(line => JSON.parse(line));
          
          currentExampleIndex = 0;
          updateTemplateLengthOptions();
          updateTemplateCheckboxes();
          updateOutput();
      } catch (error) {
          console.error('Error loading data:', error);
          outputContent.innerHTML = '<p class="text-danger">Error loading data. Please try again.</p>';
      }
  }

  function updateTemplateLengthOptions() {
      const lengths = new Set();
      currentData.forEach(example => {
          example.matched_patterns.forEach(pattern => {
              lengths.add(pattern[0].split(' ').length);
          });
      });
      const sortedLengths = Array.from(lengths).sort((a, b) => a - b);
      // sort in descending order 
      // const sortedLengths = Array.from(lengths).sort((a, b) => b - a);
      populateDropdown(templateLengthSelect, sortedLengths);
      templateLengthSelect.value = sortedLengths[0] || '';
  }

  function updateTemplateCheckboxes() {
    const currentExample = currentData[currentExampleIndex];
    const selectedLength = parseInt(templateLengthSelect.value);
    templateCheckboxes.innerHTML = '';
    templateColors = {};

    const uniqueTemplates = new Set();

    // Shuffle the matched_patterns array
    const shuffledPatterns = currentExample.matched_patterns.sort(() => Math.random() - 0.5);

    shuffledPatterns.forEach((pattern, index) => {
        const template = pattern[0];
        if (template.split(' ').length !== selectedLength) return;

        // If the template is already in the set, don't add it again
        if (uniqueTemplates.has(template)) return;
        uniqueTemplates.add(template);

        templateColors[template] = generateUniqueColor();

        const container = document.createElement('div');
        container.className = 'template-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `template-${index}`;
        checkbox.value = template;
        checkbox.checked = index === 0; // Only check the first template
        checkbox.addEventListener('change', updateOutput);

        const label = document.createElement('label');
        label.htmlFor = `template-${index}`;
        label.textContent = template;

        container.appendChild(checkbox);
        container.appendChild(label);

        templateCheckboxes.appendChild(container);
    });
    updateOutput();
}
  function clearSelection() {
      templateCheckboxes.querySelectorAll('input').forEach(checkbox => {
          checkbox.checked = false;
      });
      updateOutput();
  }

  function allSelection(){
    templateCheckboxes.querySelectorAll('input').forEach(checkbox => {
      checkbox.checked = true;
    });
    updateOutput();
  }

  function updateOutput() {
      if (!currentData || currentData.length === 0) {
          outputContent.innerHTML = '<p>No data available. Please select a dataset and model.</p>';
          return;
      }

      const selectedTemplates = Array.from(templateCheckboxes.querySelectorAll('input:checked')).map(checkbox => checkbox.value);
      const currentExample = currentData[currentExampleIndex];

      const highlightedSummary = highlightText(currentExample.generated_summary, 
          currentExample.matched_patterns.filter(pattern => selectedTemplates.includes(pattern[0])));

      outputContent.innerHTML = `
          <p><strong>Example ${currentExampleIndex + 1} of ${currentData.length}:</strong></p>
          <p>${highlightedSummary}</p>
          <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-secondary" onclick="previousExample()" ${currentExampleIndex === 0 ? 'disabled' : ''}>Previous</button>
              <button class="btn btn-primary" onclick="nextExample()" ${currentExampleIndex === currentData.length - 1 ? 'disabled' : ''}>Next</button>
          </div>
      `;

      // Update checkbox colors
      templateCheckboxes.querySelectorAll('input:checked').forEach(checkbox => {
          checkbox.parentElement.style.backgroundColor = templateColors[checkbox.value];
      });
      templateCheckboxes.querySelectorAll('input:not(:checked)').forEach(checkbox => {
          checkbox.parentElement.style.backgroundColor = '';
      });
  }

  function highlightText(text, patterns) {
    const spans = [];
    patterns.forEach((pattern, index) => {
        const color = templateColors[pattern[0]];
        const regex = new RegExp(`(${pattern[1]})`, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
            spans.push({
                start: match.index,
                end: regex.lastIndex,
                color: color
            });
        }
    });

    spans.sort((a, b) => a.start - b.start);

    let result = '';
    let lastIndex = 0;
    for (let i = 0; i < text.length; i++) {
        const activeSpans = spans.filter(span => span.start <= i && i < span.end);
        if (activeSpans.length > 0) {
            if (i > lastIndex) {
                result += text.slice(lastIndex, i);
            }
            const colors = activeSpans.map(span => span.color);
            const backgroundColor = colors.length === 1 ? colors[0] : `linear-gradient(${colors.join(', ')})`;
            result += `<span class="highlight" style="background: ${backgroundColor}; opacity: 0.95;">${text[i]}</span>`;
            lastIndex = i + 1;
        }
    }
    if (lastIndex < text.length) {
        result += text.slice(lastIndex);
    }
    return result;
}

window.previousExample = function() {
    if (currentExampleIndex > 0) {
        currentExampleIndex--;
        updateTemplateCheckboxes();
    }
};

window.nextExample = function() {
    if (currentData && currentExampleIndex < currentData.length - 1) {
        currentExampleIndex++;
        updateTemplateCheckboxes();
    }
};

  // Initial load
  loadData();
}