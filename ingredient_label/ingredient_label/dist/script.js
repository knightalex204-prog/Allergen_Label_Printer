let ingredients = [];
let labelIngredients = [];

/* WAIT UNTIL PAGE LOADS */
document.addEventListener("DOMContentLoaded", function () {
  const editor = document.getElementById("ingredient-editor");

  if (typeof Sortable !== "undefined" && editor) {
    new Sortable(editor, { 
      animation: 150,
      onEnd: function() {
        // Optional: reorder ingredients array
        const newOrder = Array.from(editor.children).map(li => {
          return ingredients.find(ing => li.textContent.includes(ing.name));
        });
        ingredients = newOrder;
        updateDropdown();
      }
    });
  }

  // Button listeners
  document.getElementById("add-ingredient-btn").addEventListener("click", addIngredient);
  document.getElementById("add-to-label-btn").addEventListener("click", addToLabel);
  document.getElementById("clear-last-btn").addEventListener("click", clearLastIngredient);
  document.getElementById("new-label-btn").addEventListener("click", newLabel);
  document.getElementById("print-label-btn").addEventListener("click", printLabel);

  // Auto-resize textareas
  document.querySelectorAll('textarea').forEach(el => {
    el.addEventListener('input', () => {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    });
  });
});

/* ADD INGREDIENT */
function addIngredient() {
  const name = document.getElementById("new-ingredient-name").value.trim();
  const contains = document.getElementById("new-ingredient-contains").value.trim();
  const allergen = document.getElementById("ingredient-allergen-checkbox").checked;
  const containsBold = document.getElementById("contains-bold-checkbox").checked;

  if (!name) {
    alert("Enter ingredient");
    return;
  }

  // Prevent duplicate names in ingredients library
  const alreadyExists = ingredients.some(ing => ing.name.toLowerCase() === name.toLowerCase());
  if (alreadyExists) {
    alert("Ingredient with this name already exists in the library!");
    return;
  }

  ingredients.push({ name, contains, allergen, containsBold });

  updateDropdown();
  updateEditor();

  // Reset input fields
  document.getElementById("new-ingredient-name").value = "";
  document.getElementById("new-ingredient-contains").value = "";
  document.getElementById("ingredient-allergen-checkbox").checked = false;
  document.getElementById("contains-bold-checkbox").checked = false;
}

/* UPDATE DROPDOWN */
function updateDropdown() {
  const drop = document.getElementById("ingredient-dropdown");
  drop.innerHTML = '<option value="">Select ingredient</option>';

  ingredients.forEach((ing, i) => {
    let text = ing.name;
    if (ing.contains) text += ` (${ing.contains})`;
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = text;
    drop.appendChild(opt);
  });
}

/* UPDATE DRAG LIST */
function updateEditor() {
  const list = document.getElementById("ingredient-editor");
  if (!list) return;

  list.innerHTML = ""; // Clear current list

  ingredients.forEach((ing, i) => {
    let text = ing.name;
    if (ing.contains) text += ` (${ing.contains})`;

    const li = document.createElement("li");
    li.textContent = text;
    li.style.position = "relative"; // So button stays on the right
    li.style.paddingRight = "25px"; // space for the button

    // Create a delete (bin) button
    const btn = document.createElement("button");
    btn.textContent = "🗑"; // bin emoji
    btn.style.position = "absolute";
    btn.style.right = "0";
    btn.style.top = "0";
    btn.style.background = "transparent";
    btn.style.border = "none";
    btn.style.cursor = "pointer";
    btn.title = "Remove ingredient";

    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent dragging
      if (confirm(`Remove ingredient "${ing.name}" from library?`)) {
        ingredients.splice(i, 1); // remove from array
        updateEditor();          // refresh list
        updateDropdown();        // refresh dropdown if you keep one for adding to label
      }
    });

    li.appendChild(btn);
    list.appendChild(li);
  });
}

/* ADD INGREDIENT TO LABEL */
function addToLabel() {
  const dropdown = document.getElementById("ingredient-dropdown");
  const index = parseInt(dropdown.value);
  if (isNaN(index)) { alert("Select ingredient"); return; }

  const ing = ingredients[index];
  if (labelIngredients.includes(ing)) { alert("Ingredient already added"); return; }

  labelIngredients.push(ing);
  updateLabel();
}

/* CLEAR LAST INGREDIENT */
function clearLastIngredient() {
  if (labelIngredients.length === 0) return;
  labelIngredients.pop();
  updateLabel();
}

/* NEW LABEL */
function newLabel() {
  labelIngredients = [];
  document.getElementById("ingredient-list").innerHTML = "";
  document.querySelectorAll("#label-container .label-input").forEach(el => el.value = "");
}

/* UPDATE LABEL DISPLAY */
function updateLabel() {
  const result = labelIngredients.map(ing => {
    let text = ing.name;

    // Only bold "contains" if the tick is checked
    if (ing.contains) {
      if (ing.containsBold) {
        text += ` (<strong>${ing.contains}</strong>)`;
      } else {
        text += ` (${ing.contains})`;
      }
    }

    // Optional: keep allergen bold
    if (ing.allergen) {
      text = `<strong>${text}</strong>`;
    }

    return text;
  });

  // Update the ingredient list in the label
  document.getElementById("ingredient-list").innerHTML = result.join(", ");
}

/* PRINT LABEL */
function printLabel() {
  const container = document.getElementById("label-container");
  if (!container) return;

  const clone = container.cloneNode(true);

  // Replace inputs and textareas with their current values as spans
clone.querySelectorAll("input, textarea").forEach(el => {
  const span = document.createElement("span");
  span.textContent = el.value;

  const computedStyle = window.getComputedStyle(el);

  span.style.width = "100%";
  span.style.display = "inline-block";
  span.style.fontSize = computedStyle.fontSize;
  span.style.fontWeight = computedStyle.fontWeight;

  // Preserve alignment; force center for storage box
  if (el.classList.contains("storage-box") || el.classList.contains("title-input")) {
    span.style.textAlign = "center";
  } else {
    span.style.textAlign = computedStyle.textAlign;
  }

  el.parentNode.replaceChild(span, el);
});

  // Make sure ingredients/allergens are black
  clone.querySelectorAll("#ingredient-list strong").forEach(el => {
    el.style.color = "black";
    el.style.fontWeight = "normal";
  });

  // Open print window
  const w = window.open("", "_blank");
  w.document.write(`
    <html>
    <head>
      <title>Print Label</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: black; }
        .label-table { width: 100%; border-collapse: collapse; }
        .label-table td, .label-table th { border: 1px solid black; padding: 6px; vertical-align: top; }
        span { color: black; }
      </style>
    </head>
    <body>${clone.outerHTML}</body>
    </html>
  `);
  w.document.close();
  w.print();
}