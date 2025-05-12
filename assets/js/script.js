let countries = [];
let cities = [];

// Carga de Países
document.addEventListener("DOMContentLoaded", async () => {
  countries = await fetchData("./sources/countries.json");
  cities = await fetchData("./sources/cities.json");

  populateCountries();

  const expMonthSelect = document.getElementById("expMonth");
  const expYearSelect = document.getElementById("expYear");

  for (let i = 1; i <= 12; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i.toString().padStart(2, "0");
    expMonthSelect.appendChild(opt);
  }

  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y <= 2035; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    expYearSelect.appendChild(opt);
  }

  const paymentMethodSelect = document.getElementById("paymentMethod");
  const payBtn = document.getElementById("payBtn");

  const forms = {
    credit_card: document.getElementById("creditCardForm"),
    paypal: document.getElementById("paypalForm"),
    pse: document.getElementById("pseForm")
  };

  const allForms = Object.values(forms);

  // Mostrar el formulario adecuado al seleccionar el método
  paymentMethodSelect.addEventListener("change", () => {
    const selected = paymentMethodSelect.value;

    allForms.forEach(form => form.style.display = "none");
    payBtn.disabled = true; // Deshabilitar por defecto

    if (forms[selected]) {
      forms[selected].style.display = "block";
    }
  });

  // Validar solo los campos visibles
  function validateVisibleForm() {
    const selected = paymentMethodSelect.value;
    const currentForm = forms[selected];

    if (!currentForm) {
      payBtn.disabled = true;
      return;
    }

    const requiredFields = currentForm.querySelectorAll("input, select");
    let isValid = true;

    requiredFields.forEach(field => {
      if (field.offsetParent !== null && !field.value.trim()) {
        isValid = false;
      }
    });

    payBtn.disabled = !isValid;
  }

  // Escuchar cambios en todos los inputs y selects de todos los formularios
  allForms.forEach(form => {
    const inputs = form.querySelectorAll("input, select");
    inputs.forEach(input => input.addEventListener("input", validateVisibleForm));
  });
    
});

async function fetchData(path) {
  const response = await fetch(path);
  return await response.json();
}

function populateCountries() {
  const countrySelect = document.getElementById("country");

  countries.forEach(country => {
    const option = document.createElement("option");
    option.value = country.name;
    option.textContent = country.name;
    countrySelect.appendChild(option);
  });
  
}

// Google Translate
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("translateToggle");
  const translateBox = document.getElementById("google_translate_element");

  toggleBtn.addEventListener("click", () => {
    translateBox.style.display = (translateBox.style.display === "none" || translateBox.style.display === "") 
      ? "block" 
      : "none";
  });
});

function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'es',
    includedLanguages: 'en,es,fr,de,it,pt,ja,zh-CN,ru',
    layout: google.translate.TranslateElement.InlineLayout.SIMPLE
  }, 'google_translate_element');
}

// Register

document.getElementById("registerForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const username = document.getElementById("newUsername").value;
  const password = document.getElementById("newPassword").value;

  const userData = {
    username,
    email: document.getElementById("email").value,
    password,
    birthdate: document.getElementById("birthdate").value,
    country: document.getElementById("country").value ,
    city: document.getElementById("city").value,
    address: document.getElementById("address").value, 
    first_name: document.getElementById("first_name").value, 
    last_name: document.getElementById("last_name").value
  };

  try {
    // Enviar datos de registro
    const response = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userData)
    });

    const result = await response.json();

    if (result.success) {
      // Login automático tras registro
      const loginResponse = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });

      const loginData = await loginResponse.json();

      if (loginData.success) {
        location.hash = '';
        document.getElementById('loginItem').style.display = 'none';
        document.getElementById('accountItem').style.display = 'inline-block';
        document.getElementById('logoutItem').style.display = 'inline-block';
        
        alert("Registro e inicio de sesión exitoso.");

      } else {
        alert("Registro exitoso, pero no se pudo iniciar sesión.");
      }

    } else {
      alert("Error en el registro: " + result.message);
    }

  } catch (error) {
    console.error("Error al registrar:", error);
    alert("Error al conectar con el servidor");
  }
});

document.getElementById('newUsername').addEventListener('input', function () {
  const maxLength = 30;
  const msg = document.getElementById('usernameLimitMsg');

  if (this.value.length >= maxLength) {
    msg.style.display = 'inline';
  } else {
    msg.style.display = 'none';
  }
});

const passwordInput = document.getElementById('newPassword');
const strengthBar = document.getElementById('strengthBar');
const passwordError = document.getElementById('passwordError');

passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    let score = 0;

    // Reglas de seguridad
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // Actualizar barra
    let width = (score / 5) * 100;
    strengthBar.style.width = width + '%';

    // Cambiar color según puntuación
    if (score <= 2) {
      strengthBar.style.background = 'red';
      passwordError.textContent = 'La contraseña es débil.';
    } else if (score === 3 || score === 4) {
      strengthBar.style.background = 'orange';
      passwordError.textContent = 'La contraseña es moderada.';
    } else {
      strengthBar.style.background = 'green';
      passwordError.textContent = '';
    }

    // Limitar longitud máxima
    if (password.length > 64) {
      passwordError.textContent = 'La contraseña no puede tener más de 64 caracteres.';
      strengthBar.style.background = 'red';
    }
});

document.getElementById('registerForm').addEventListener('submit', function(e) {
    const password = passwordInput.value;

    if (password.length < 8) {
      e.preventDefault(); // Evita que se envíe el formulario
      passwordError.textContent = 'La contraseña debe tener al menos 8 caracteres.';
      strengthBar.style.background = 'red';
      alert("La contraseña debe tener al menos 8 caracteres.");
    }
});

// Login 
document.getElementById("loginForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include" // importante para que se guarde la sesión
  });

  const data = await response.json();

  if (data.success) {
    location.hash = '';
    document.getElementById('loginItem').style.display = 'none';
    document.getElementById('accountItem').style.display = 'inline-block';
    document.getElementById('logoutItem').style.display = 'inline-block';
    
    if (data.user_type_id === 1) {
      document.getElementById('h3admon').style.display = 'block';
    }

  } else {
    alert(data.message);
  }
});

// My account
document.getElementById("accountItem").addEventListener("click", async function(e) {
  e.preventDefault();

  try {
    const response = await fetch("http://localhost:3000/account", {
      method: "GET",
      credentials: "include"
    });

    const data = await response.json();

    if (data.success) {
      const user = data.user;

      // Llenar el formulario con los datos recibidos
      document.getElementById("accountUsername").value = user.username || '';
      document.getElementById("accountEmail").value = user.email || '';
      document.getElementById("accountFirst_Name").value = user.first_name || '';
      document.getElementById("accountLast_Name").value = user.last_name || '';
      document.getElementById("accountBirthdate").value = user.birthdate ? user.birthdate.split('T')[0] : '';
      document.getElementById("accountCountry").value = user.country || '';
      document.getElementById("accountCity").value = user.city || '';
      document.getElementById("accountAddress").value = user.address || '';

      // Cambiar a la vista de cuenta si estás usando hashes
      location.hash = '#account';
    } else {
      alert(data.message || 'No se pudieron obtener los datos');
    }
  } catch (error) {
    console.error("Error al obtener datos de cuenta:", error);
    alert("Error al cargar datos de cuenta.");
  }
});

// Modify Account
document.getElementById('SaveAccountBtn').addEventListener('click', async function () {
  const email = document.getElementById('accountEmail').value;
  const first_name = document.getElementById('accountFirst_Name').value;
  const last_name = document.getElementById('accountLast_Name').value;
  const birthdate = document.getElementById('accountBirthdate').value;
  const country = document.getElementById('accountCountry').value;
  const city = document.getElementById('accountCity').value;
  const address = document.getElementById('accountAddress').value;

  const response = await fetch("http://localhost:3000/account", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, first_name, last_name, birthdate, country, city, address })
  });

  const result = await response.json();

  if (result.success) {
    alert("Datos actualizados correctamente");
    const fields = document.querySelectorAll("#accountForm input");
    fields.forEach(field => {
    field.disabled = true;

    // Cambiar color de fondo si está habilitado o no
    if (!field.disabled) {
      field.style.backgroundColor = "rgb(119 119 119)"; // fondo blanco editable
    } else {
      field.style.backgroundColor = "transparent"; // fondo gris claro no editable
    }
  });

  document.getElementById("editAccountBtn").style.display = "inline-block";
  document.getElementById("CancelAccountBtn").style.display = "none";
  document.getElementById("SaveAccountBtn").style.display = "none";
    toggleAccountFields(false);
  } else {
    alert("Error al actualizar: " + result.message);
  }
});

// Check Session
document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("http://localhost:3000/check-session", {
    method: "GET",
    credentials: "include"
  });

  const data = await res.json();

  if (data.success) {
    document.getElementById("loginItem").style.display = "none";
    document.getElementById("accountItem").style.display = "inline-block";
    document.getElementById("logoutItem").style.display = "inline-block";

    if (data.user && data.user.user_type_id === 1) {
      document.getElementById('h3admon').style.display = 'block';
    }
    
  }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", async function(e) {
  e.preventDefault();

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.textContent = "Cerrando sesión...";

  const response = await fetch("http://localhost:3000/logout", {
    method: "GET",
    credentials: "include"
  });

  const data = await response.json();

  if (data.success) {
    document.getElementById("loginItem").style.display = "inline-block";
    document.getElementById("accountItem").style.display = "none";
    document.getElementById("logoutItem").style.display = "none";
    document.getElementById('h3admon').style.display = 'none';
    logoutBtn.textContent = "Cerrar sesión";
  } else {
    alert("Error al cerrar sesión");
    logoutBtn.textContent = "Cerrar sesión";
  }
});

// Edit Account
document.getElementById("editAccountBtn").addEventListener("click", () => {
  const fields = document.querySelectorAll("#accountForm input");
  fields.forEach(field => {
    field.disabled = !field.disabled;

    // Cambiar color de fondo si está habilitado o no
    if (!field.disabled) {
      field.style.backgroundColor = "rgb(119 119 119)"; // fondo blanco editable
    } else {
      field.style.backgroundColor = "transparent"; // fondo gris claro no editable
    }
  });

  document.getElementById("editAccountBtn").style.display = "none";
  document.getElementById("CancelAccountBtn").style.display = "inline-block";
  document.getElementById("SaveAccountBtn").style.display = "inline-block";

});

// Cancel Edit
document.getElementById("CancelAccountBtn").addEventListener("click", () => {
  const fields = document.querySelectorAll("#accountForm input");
  fields.forEach(field => {
    field.disabled = !field.disabled;

    // Cambiar color de fondo si está habilitado o no
    if (!field.disabled) {
      field.style.backgroundColor = "rgb(119 119 119)"; // fondo blanco editable
    } else {
      field.style.backgroundColor = "transparent"; // fondo gris claro no editable
    }
  });

  document.getElementById("editAccountBtn").style.display = "inline-block";
  document.getElementById("CancelAccountBtn").style.display = "none";
  document.getElementById("SaveAccountBtn").style.display = "none";

});

window.addEventListener('DOMContentLoaded', () => {
  const birthdateInput = document.getElementById('birthdate');
  const today = new Date();
  const sixYearsAgo = new Date(today.getFullYear() - 6, today.getMonth(), today.getDate());

  birthdateInput.max = sixYearsAgo.toISOString().split('T')[0];
});

// Torneos

document.getElementById("getTournaments").addEventListener("click", async function () {
  try {
    const response = await fetch("http://localhost:3000/tournaments", {
      method: "GET",
      credentials: "include"
    });

    const data = await response.json();

    if (data.success) {
      const sessionResponse = await fetch("http://localhost:3000/check-session", {
        credentials: "include"
      });

      const sessionData = await sessionResponse.json();
      const isAdmin = sessionData?.user?.user_type_id === 1;
      console.log(isAdmin);

      // Renderizar torneos con o sin funciones admin
      renderTorneos(data.tournaments, isAdmin);

    } else {
      alert("No se pudieron los torneos.");
    }
  } catch (error) {
    console.error("Error al obtener torneos:", error);
    alert("Error al cargar torneos.");
  }
});

async function renderTorneos() {
  const response = await fetch('http://localhost:3000/tournaments');
  const data = await response.json();
  const torneos = data.success ? data.tournaments : [];

  window.listaDeTorneos = data.tournaments;

  let inscritos = [];
  const sessionRes = await fetch("http://localhost:3000/check-session", { credentials: "include" });
  const sessionData = await sessionRes.json();

  const isLoggedIn = sessionData.success;
  const user = sessionData.user;
  const isAdmin = user && user.user_type_id === 1;

  console.log(isAdmin);

  if (isLoggedIn) {
    const regRes = await fetch("http://localhost:3000/user-registrations", { credentials: "include" });
    const regData = await regRes.json();
    if (regData.success) {
      inscritos = regData.inscritos;
    }
  }

  const tbody = document.querySelector(".tournament-table tbody");
  tbody.innerHTML = ""; // Limpiar tabla

  torneos.forEach(torneo => {
    const fila = document.createElement("tr");

    // TODO: puedes formatear fechas si lo deseas
    fila.innerHTML = `
      <td>${torneo.name}</td>
      <td>--</td> <!-- puedes mostrar participantes reales luego -->
      <td>$${torneo.registration_fee} USD</td>
    `;



    if (inscritos.includes(torneo.tournament_id)) {
      fila.innerHTML += `<td><button class="btn-register" disabled>Inscrito</button></td>`;
    } else {
      fila.innerHTML += `<td><button class="btn-register" onclick="inscribirTorneo(${torneo.tournament_id}, this)">Inscribirse</button></td>`;
    }

    if (isAdmin) {
      fila.innerHTML += `
        <td><button onclick="modificarTorneo(${torneo.tournament_id})">
          <i class="fas fa-edit" style="font-size: 20px; color:rgb(248, 188, 225); cursor: pointer;"></i>
        </button></td>
        <td><button onclick="eliminarTorneo(${torneo.tournament_id})">
          <i class="fas fa-trash" style="font-size: 20px; color: #f44336; cursor: pointer;"></i>
        </button></td>
      `;
    }

    tbody.appendChild(fila);
  });
}

async function inscribirTorneo(torneoId) {
  // Verificar sesión
  const res = await fetch("http://localhost:3000/check-session", {
    method: "GET",
    credentials: "include"
  });
  const data = await res.json();

  if (!data.success) {
    location.hash = "#login";
    return;
  }

  // Obtener detalles del torneo para mostrar
  const torneo = window.listaDeTorneos.find(t => t.tournament_id === torneoId);
  if (!torneo) return;

  // Guardar torneo actual en variable global
  window.torneoSeleccionado = torneo;

  // Mostrar artículo de pago y ocultar el de torneos
  document.getElementById("Payment").style.display = "block";
  document.getElementById("torneos").style.display = "none";

  // Rellenar la información del torneo en los campos correspondientes
  document.getElementById("paymentTournamentName").textContent = torneo.name;
  document.getElementById("paymentTournamentDescription").textContent = torneo.description;
  document.getElementById("paymentTournamentFee").textContent = torneo.registration_fee;

  // Navegar al hash del formulario de pago
  location.hash = "#Payment";
}

function mostrarMensaje(mensaje) {
  const mensajeDiv = document.createElement("div");
  mensajeDiv.textContent = mensaje;
  mensajeDiv.style.backgroundColor = "#4caf50";
  mensajeDiv.style.color = "white";
  mensajeDiv.style.padding = "10px";
  mensajeDiv.style.margin = "10px 0";
  mensajeDiv.style.borderRadius = "5px";
  document.getElementById("torneos").prepend(mensajeDiv);

  setTimeout(() => mensajeDiv.remove(), 5000);
}

// PAYMENT

const exchangeRates = {
  USD: 1,
  COP: 4000, // 1 USD = 4000 COP (ejemplo)
  EUR: 0.92
};

document.getElementById("changeCurrencyBtn").addEventListener("click", () => {
  document.getElementById("currencySelector").style.display = "block";
});

// Escuchar cambios de divisa
document.getElementById("currency").addEventListener("change", () => {
  const selectedCurrency = document.getElementById("currency").value;
  const feeUSD = window.torneoSeleccionado.registration_fee;
  const converted = (feeUSD * exchangeRates[selectedCurrency]).toFixed(2);

  document.getElementById("paymentTournamentFee").textContent = converted;
  document.getElementById("currencyLabel").textContent = selectedCurrency;
});

document.getElementById("paymentMethod").addEventListener("change", function () {
  const method = this.value;

  // Ocultar todos los formularios primero
  document.querySelectorAll(".payment-form").forEach(form => {
    form.style.display = "none";
  });

  // Mostrar el formulario correspondiente
  if (method === "credit_card") {
    document.getElementById("creditCardForm").style.display = "block";
  } else if (method === "paypal") {
    document.getElementById("paypalForm").style.display = "block";
  } else if (method === "pse") {
    document.getElementById("pseForm").style.display = "block";
  }

  // Activar botón de pagar solo si se selecciona un método
  document.getElementById("payBtn").disabled = (method === "");
});

document.getElementById("PaymentForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const payBtn = document.getElementById("payBtn");
  const loadingPopup = document.getElementById("loadingPopup");
  const paymentResult = document.getElementById("paymentResult");

  // Mostrar popup de carga
  loadingPopup.style.display = "flex";

  // Esperar 5 segundos (simulación de procesamiento)
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Obtener ID del torneo
  const torneoId = window.torneoSeleccionado?.tournament_id;
  if (!torneoId) {
    alert("Error: torneo no encontrado.");
    loadingPopup.style.display = "none";
    return;
  }

  // Hacer la solicitud al backend para inscribirse
  const res = await fetch("http://localhost:3000/inscribirse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ tournament_id: torneoId })
  });

  const data = await res.json();

  // Ocultar popup de carga
  loadingPopup.style.display = "none";

  if (data.success) {
    // Mostrar resultado
    document.getElementById("Payment").style.display = "none";
    paymentResult.style.display = "block";
    location.hash = "#paymentResult";
  } else {
    alert("Error al inscribirse: " + data.message);
  }
});

function updateRequiredFields() {
  document.querySelectorAll('.payment-form').forEach(form => {
    const isVisible = form.offsetParent !== null;
    form.querySelectorAll('input, select').forEach(input => {
      if (isVisible) {
        input.setAttribute('required', 'required');
      } else {
        input.removeAttribute('required');
      }
    });
  });
}

document.getElementById("paymentMethod").addEventListener("change", () => {
  const method = document.getElementById("paymentMethod").value;

  // Ocultar todos los formularios
  document.querySelectorAll(".payment-form").forEach(f => f.style.display = "none");

  // Mostrar el seleccionado
  if (method) {
    document.getElementById(`${method}Form`).style.display = "block";
  }

  updateRequiredFields(); // Actualiza `required` según visibilidad
});
