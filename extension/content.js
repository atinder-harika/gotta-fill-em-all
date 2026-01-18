// Content script - runs on all web pages to detect and highlight form fields
console.log('[Content Script] Gotta Fill \'Em All loaded');

let highlightedElement = null;

// Listen for messages from the extension (via background worker)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Content Script] Received message:', message);
  
  if (message.type === 'HIGHLIGHT_FIELD') {
    highlightField(message.fieldName, message.fieldValue);
    sendResponse({ success: true });
  }
  
  if (message.type === 'CLEAR_HIGHLIGHT') {
    clearHighlight();
    sendResponse({ success: true });
  }
  
  if (message.type === 'SCAN_PAGE') {
    const pageData = extractPageData();
    sendResponse({ success: true, data: pageData });
  }
  
  return true; // Keep channel open for async response
});

/**
 * Extract all form data from current page
 * @returns {Object} Page title, URL, and form fields
 */
function extractPageData() {
  console.log('[Content Script] Extracting page data...');
  
  const pageData = {
    title: document.title,
    url: window.location.href,
    forms: [],
    fields: []
  };
  
  // Find all forms
  const forms = document.querySelectorAll('form');
  pageData.forms = Array.from(forms).map((form, index) => ({
    id: form.id || `form-${index}`,
    name: form.name || '',
    action: form.action || '',
    method: form.method || 'get'
  }));
  
  // Find all input fields (in forms or standalone)
  const inputs = document.querySelectorAll('input, textarea, select');
  pageData.fields = Array.from(inputs).map((input) => {
    const field = {
      type: input.type || input.tagName.toLowerCase(),
      name: input.name || '',
      id: input.id || '',
      placeholder: input.placeholder || '',
      label: '',
      required: input.required || false,
      value: input.value || ''
    };
    
    // Try to find associated label
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        field.label = label.textContent.trim();
      }
    }
    
    // Check for parent label
    if (!field.label) {
      const parentLabel = input.closest('label');
      if (parentLabel) {
        field.label = parentLabel.textContent.trim();
      }
    }
    
    return field;
  }).filter(field => 
    // Filter out hidden, submit, and button fields
    field.type !== 'hidden' && 
    field.type !== 'submit' && 
    field.type !== 'button' &&
    field.type !== 'reset'
  );
  
  console.log('[Content Script] Extracted:', pageData.fields.length, 'fields');
  return pageData;
}

/**
 * Highlight a form field with golden glow effect
 * @param {string} fieldName - The name/id/label of the field to highlight
 * @param {string} fieldValue - Optional value to display in tooltip
 */
function highlightField(fieldName, fieldValue) {
  // Clear previous highlight
  clearHighlight();
  
  // Find the input field
  const field = findInputField(fieldName);
  
  if (!field) {
    console.warn('[Content Script] Field not found:', fieldName);
    return;
  }
  
  console.log('[Content Script] Highlighting field:', field);
  
  // Store reference
  highlightedElement = field;
  
  // Add highlight class
  field.classList.add('pb-highlight');
  
  // Scroll into view
  field.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'center' 
  });
  
  // Create tooltip with value if provided
  if (fieldValue) {
    createTooltip(field, fieldValue);
  }
  
  // Watch for user input
  const inputHandler = (e) => {
    console.log('[Content Script] Field filled by user');
    
    // Send message back to panel
    chrome.runtime.sendMessage({
      type: 'FIELD_FILLED',
      fieldName: fieldName,
      fieldValue: e.target.value
    });
    
    // Clear highlight after fill
    setTimeout(() => clearHighlight(), 1000);
    
    // Remove listener
    field.removeEventListener('input', inputHandler);
  };
  
  field.addEventListener('input', inputHandler);
}

/**
 * Find input field by various selectors
 * @param {string} fieldName - Field identifier (id, name, placeholder, label text)
 * @returns {HTMLElement|null}
 */
function findInputField(fieldName) {
  console.log('[Content Script] Searching for field:', fieldName);
  
  const lowerName = fieldName.toLowerCase();
  // Normalize: remove spaces, special chars for better matching
  const normalizedName = lowerName.replace(/[^a-z0-9]/g, '');
  console.log('[Content Script] Normalized search term:', normalizedName);
  
  // Try exact ID
  let field = document.getElementById(fieldName);
  if (field) {
    console.log('[Content Script] Found by ID');
    return field;
  }
  
  // Try exact name attribute
  field = document.querySelector(`input[name="${fieldName}"]`);
  if (field) {
    console.log('[Content Script] Found by name attribute');
    return field;
  }
  
  // Try partial match on name/id/placeholder with normalized comparison
  const inputs = document.querySelectorAll('input, textarea, select');
  console.log('[Content Script] Checking', inputs.length, 'input fields');
  
  for (const input of inputs) {
    const id = (input.id || '').toLowerCase();
    const name = (input.name || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    
    // Normalize field attributes for comparison
    const normalizedId = id.replace(/[^a-z0-9]/g, '');
    const normalizedInputName = name.replace(/[^a-z0-9]/g, '');
    const normalizedPlaceholder = placeholder.replace(/[^a-z0-9]/g, '');
    
    if (normalizedId.includes(normalizedName) || 
        normalizedInputName.includes(normalizedName) || 
        normalizedPlaceholder.includes(normalizedName)) {
      console.log('[Content Script] Found match! ID:', input.id, 'Name:', input.name);
      return input;
    }
  }
  
  // Try label text
  const labels = document.querySelectorAll('label');
  console.log('[Content Script] Checking', labels.length, 'labels');
  
  for (const label of labels) {
    const labelText = label.textContent.toLowerCase();
    const normalizedLabel = labelText.replace(/[^a-z0-9]/g, '');
    
    if (normalizedLabel.includes(normalizedName)) {
      console.log('[Content Script] Found by label text:', label.textContent);
      const forAttr = label.getAttribute('for');
      if (forAttr) {
        const foundField = document.getElementById(forAttr);
        if (foundField) {
          console.log('[Content Script] Found associated input with ID:', forAttr);
          return foundField;
        }
      }
      // Check for nested input
      const nestedInput = label.querySelector('input, textarea, select');
      if (nestedInput) {
        console.log('[Content Script] Found nested input');
        return nestedInput;
      }
    }
  }
  
  console.log('[Content Script] No match found for:', fieldName);
  return null;
}

/**
 * Create tooltip showing the value to be pasted
 */
function createTooltip(field, value) {
  const tooltip = document.createElement('div');
  tooltip.className = 'pb-tooltip';
  tooltip.textContent = `Ready to paste: ${value}`;
  
  // Position near field
  const rect = field.getBoundingClientRect();
  tooltip.style.top = `${rect.top - 40}px`;
  tooltip.style.left = `${rect.left}px`;
  
  document.body.appendChild(tooltip);
  
  // Store reference for cleanup
  field._pbTooltip = tooltip;
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (tooltip.parentNode) {
      tooltip.remove();
    }
  }, 5000);
}

/**
 * Clear highlight and tooltip
 */
function clearHighlight() {
  if (highlightedElement) {
    highlightedElement.classList.remove('pb-highlight');
    
    // Remove tooltip if exists
    if (highlightedElement._pbTooltip) {
      highlightedElement._pbTooltip.remove();
      delete highlightedElement._pbTooltip;
    }
    
    highlightedElement = null;
  }
}

// Clean up on page unload
window.addEventListener('beforeunload', clearHighlight);
