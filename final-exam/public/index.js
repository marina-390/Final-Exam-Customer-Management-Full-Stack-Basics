let selectedId = null;

// ─── Input filtering: block invalid keypresses live ──────────────────────────

function attachInputFilters() {
  // Names: only letters (including nordic/accented), spaces, hyphens, apostrophes
  ["first_name", "last_name"].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener("keypress", e => {
      if (!/[A-Za-zÀ-ÖØ-öø-ÿ\s\-']/.test(e.key)) {
        e.preventDefault();
        showFieldError(id, "Only letters are allowed.");
      } else {
        clearFieldError(id);
      }
    });
    input.addEventListener("input", () => {
      // Strip any numbers that might be pasted in
      const cleaned = input.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s\-']/g, "");
      if (cleaned !== input.value) {
        input.value = cleaned;
        showFieldError(id, "Only letters are allowed.");
      } else {
        clearFieldError(id);
      }
    });
  });

  // Phone: only digits, +, spaces, hyphens, parentheses
  const phone = document.getElementById("phone");
  phone.addEventListener("keypress", e => {
    if (!/[0-9+\s\-()\.]/.test(e.key)) {
      e.preventDefault();
      showFieldError("phone", "Only numbers are allowed.");
    } else {
      clearFieldError("phone");
    }
  });
  phone.addEventListener("input", () => {
    const cleaned = phone.value.replace(/[^0-9+\s\-()]/g, "");
    if (cleaned !== phone.value) {
      phone.value = cleaned;
      showFieldError("phone", "Only numbers are allowed.");
    } else {
      clearFieldError("phone");
    }
  });

  // Email: validate format on blur
  const email = document.getElementById("email");
  email.addEventListener("blur", () => {
    const val = email.value.trim();
    if (val && !isValidEmail(val)) {
      showFieldError("email", "Please enter a valid email address.");
    } else {
      clearFieldError("email");
    }
  });
  email.addEventListener("input", () => {
    clearFieldError("email");
  });
}

function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function showFieldError(id, msg) {
  const el = document.getElementById("err-" + id);
  if (el) el.textContent = msg;
  const input = document.getElementById(id);
  if (input) input.classList.add("input-error");
}

function clearFieldError(id) {
  const el = document.getElementById("err-" + id);
  if (el) el.textContent = "";
  const input = document.getElementById(id);
  if (input) input.classList.remove("input-error");
}

function clearAllFieldErrors() {
  ["first_name", "last_name", "email", "phone"].forEach(clearFieldError);
}

// ─── Validate all fields before submit ───────────────────────────────────────

function validateForm(data) {
  let valid = true;

  if (!data.first_name) {
    showFieldError("first_name", "First name is required."); valid = false;
  } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s\-']+$/.test(data.first_name)) {
    showFieldError("first_name", "Only letters are allowed."); valid = false;
  }

  if (!data.last_name) {
    showFieldError("last_name", "Last name is required."); valid = false;
  } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s\-']+$/.test(data.last_name)) {
    showFieldError("last_name", "Only letters are allowed."); valid = false;
  }

  if (!data.email) {
    showFieldError("email", "Email is required."); valid = false;
  } else if (!isValidEmail(data.email)) {
    showFieldError("email", "Please enter a valid email address."); valid = false;
  }

  if (data.phone && !/^[0-9+\s\-()]+$/.test(data.phone)) {
    showFieldError("phone", "Only numbers are allowed."); valid = false;
  }

  return valid;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFormData() {
  return {
    first_name: document.getElementById("first_name").value.trim(),
    last_name:  document.getElementById("last_name").value.trim(),
    email:      document.getElementById("email").value.trim(),
    phone:      document.getElementById("phone").value.trim(),
    birth_date: document.getElementById("birth_date").value || null,
  };
}

function fillForm(person) {
  document.getElementById("first_name").value = person.first_name  || "";
  document.getElementById("last_name").value  = person.last_name   || "";
  document.getElementById("email").value      = person.email       || "";
  document.getElementById("phone").value      = person.phone       || "";
  document.getElementById("birth_date").value = person.birth_date
    ? person.birth_date.slice(0, 10)
    : "";
}

function clearForm() {
  selectedId = null;
  document.getElementById("first_name").value = "";
  document.getElementById("last_name").value  = "";
  document.getElementById("email").value      = "";
  document.getElementById("phone").value      = "";
  document.getElementById("birth_date").value = "";
  clearAllFieldErrors();
  setStatus("");
  setEditMode(false);
}

function setEditMode(editing) {
  document.getElementById("btn-add").classList.toggle("hidden", editing);
  document.getElementById("btn-update").classList.toggle("hidden", !editing);
  document.getElementById("btn-delete").classList.toggle("hidden", !editing);
  document.getElementById("btn-clear").classList.toggle("hidden", !editing);
  document.getElementById("form-title").textContent = editing ? "Edit Customer" : "Add Customer";

  document.querySelectorAll(".customer-card").forEach(card => {
    card.classList.toggle("active", editing && Number(card.dataset.id) === selectedId);
  });
}

function setStatus(msg, isError = false) {
  const el = document.getElementById("form-status");
  el.textContent = msg;
  el.className = msg ? (isError ? "status error" : "status success") : "";
}

function updateCount(count) {
  const badge = document.getElementById("customer-count");
  if (badge) badge.textContent = count;
}

// ─── Load / render list ───────────────────────────────────────────────────────

async function loadCustomers() {
  const container = document.getElementById("customer-list");

  try {
    const res  = await fetch("/api/persons");
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();

    container.innerHTML = "";
    updateCount(data.length);

    if (data.length === 0) {
      container.innerHTML = "<p>No customers found.</p>";
      return;
    }

    data.forEach(person => {
      const div = document.createElement("div");
      div.className  = "customer-card";
      div.dataset.id = person.id;

      const birthFormatted = person.birth_date
        ? new Date(person.birth_date).toLocaleDateString("fi-FI")
        : "—";

      div.innerHTML = `
        <div class="card-name">👤 ${person.first_name} ${person.last_name}</div>
        <div class="card-detail">✉️ ${person.email}</div>
        <div class="card-detail">📞 ${person.phone || "—"}</div>
        <div class="card-detail">🎂 ${birthFormatted}</div>
      `;

      div.addEventListener("click", () => selectCustomer(person));
      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p class='err'>Error loading customers.</p>";
    updateCount(0);
  }
}

// ─── Select ───────────────────────────────────────────────────────────────────

function selectCustomer(person) {
  selectedId = person.id;
  fillForm(person);
  clearAllFieldErrors();
  setEditMode(true);
  setStatus(`Editing: ${person.first_name} ${person.last_name}`);
}

// ─── Create ───────────────────────────────────────────────────────────────────

async function addCustomer() {
  clearAllFieldErrors();
  const body = getFormData();
  if (!validateForm(body)) return;

  try {
    const res = await fetch("/api/persons", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) { setStatus(data.error || "Failed to add customer.", true); return; }

    setStatus(`Customer "${data.person.first_name} ${data.person.last_name}" added!`);
    clearForm();
    loadCustomers();

  } catch (err) {
    console.error(err);
    setStatus("Network error.", true);
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

async function updateCustomer() {
  if (!selectedId) return;
  clearAllFieldErrors();
  const body = getFormData();
  if (!validateForm(body)) return;

  try {
    const res = await fetch(`/api/persons/${selectedId}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) { setStatus(data.error || "Failed to update.", true); return; }

    setStatus("Customer updated successfully.");
    clearForm();
    loadCustomers();

  } catch (err) {
    console.error(err);
    setStatus("Network error.", true);
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function deleteCustomer() {
  if (!selectedId) return;
  if (!confirm("Are you sure you want to delete this customer?")) return;

  try {
    const res  = await fetch(`/api/persons/${selectedId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { setStatus(data.error || "Failed to delete.", true); return; }

    setStatus("Customer deleted.");
    clearForm();
    loadCustomers();

  } catch (err) {
    console.error(err);
    setStatus("Network error.", true);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

attachInputFilters();
loadCustomers();