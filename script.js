document.addEventListener("DOMContentLoaded", main);

function main() {
  // Setup listeners for core site functionality
  setupCoreEventListeners();
  // Setup listeners for feature-specific elements (forms, etc.)
  setupFeatureSpecificEventListeners();
  // Load dynamic content from JSON files
  loadDynamicContent();
}

/**
 * Sets up listeners for core site functionality like navbar, scrolling, etc.
 */
function setupCoreEventListeners() {
  setupNavbar();
  setupSmoothScroll();
  setupContentRevealObserver();
  initModals(); // Centralized modal management
  setupNavbarSectionObserver();
}

/**
 * Sets up listeners for features that might be enabled or disabled,
 * like different forms.
 */
function setupFeatureSpecificEventListeners() {
  /* --- To disable the Lucky Draw, comment out the line below --- */
  setupLuckyDrawForm();

  /* --- To re-enable the Reservation Form, uncomment the line below --- */
  // setupReservationForm();
}

/**
 * Fetches data from JSON files and populates the page.
 */
async function loadDynamicContent() {
  try {
    const [menuData, reviewData, videoData] = await Promise.all([
      fetch("datas/menu.json").then((res) => res.json()),
      fetch("datas/reviews.json").then((res) => res.json()),
      fetch("datas/videos.json").then((res) => res.json()),
    ]);

    populateMenu(menuData);
    populateReviews(reviewData);
    populateVideos(videoData);

    setupMenuFilter();
    setupVideoLinks();
    setTimeout(setupNavbarSectionObserver, 100);
  } catch (error) {
    console.error("Failed to load dynamic content:", error);
  }
}

// --- MODAL MANAGEMENT (CENTRALIZED) ---

function initModals() {
  document.querySelectorAll(".modal-overlay").forEach((modal) => {
    const modalId = modal.id;
    const closeBtn = modal.querySelector(".modal-close");
    const hide = () => hideModal(modalId);
    if (closeBtn) closeBtn.addEventListener("click", hide);
    modal.addEventListener("click", (e) => e.target === modal && hide());
  });

  document.querySelectorAll("[data-modal-trigger]").forEach((trigger) => {
    const modalId = trigger.dataset.modalTrigger;
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      showModal(modalId);
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const visibleModal = document.querySelector(".modal-overlay.visible");
      if (visibleModal) hideModal(visibleModal.id);
    }
  });
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => modal.classList.add("visible"), 10);
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove("visible");
  document.body.style.overflow = "";
  modal.addEventListener("transitionend", () => (modal.hidden = true), {
    once: true,
  });
}

// --- FORM VALIDATION UTILITIES ---

/**
 * Displays an error message for a specific form input.
 * @param {HTMLInputElement} input The input element with an error.
 * @param {string} message The error message to display.
 */
function showFormError(input, message) {
  const formGroup = input.parentElement;
  const errorElement = formGroup.querySelector(".form-error-message");
  formGroup.classList.add("error");
  errorElement.textContent = message;
}

/**
 * Clears all error messages and styles from a form.
 * @param {HTMLFormElement} form The form element to clear errors from.
 */
function clearFormErrors(form) {
  form.querySelectorAll(".form-group.error").forEach((formGroup) => {
    formGroup.classList.remove("error");
    formGroup.querySelector(".form-error-message").textContent = "";
  });
}

// --- FEATURE: LUCKY DRAW FORM ---
// To disable this feature, comment out the entire function and its call in setupFeatureSpecificEventListeners.
function setupLuckyDrawForm() {
  const form = document.getElementById("lucky-draw-form");
  if (!form) return;

  const nameInput = document.getElementById("lucky-draw-name");
  const mobileInput = document.getElementById("mobile-number");
  const couponInput = document.getElementById("coupon-code");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearFormErrors(form);
    let isValid = true;

    if (nameInput.value.trim() === "") {
      showFormError(nameInput, "Please enter your full name.");
      isValid = false;
    }
    if (mobileInput.value.trim() === "") {
      showFormError(mobileInput, "Please enter your mobile number.");
      isValid = false;
    } else if (!/^\d{10}$/.test(mobileInput.value.trim())) {
      showFormError(
        mobileInput,
        "Please enter a valid 10-digit mobile number."
      );
      isValid = false;
    }
    if (couponInput.value.trim() === "") {
      showFormError(couponInput, "Please enter your coupon code.");
      isValid = false;
    }

    if (isValid) {
      const mailtoLink = `mailto:biryanimall.in@gmail.com?subject=${encodeURIComponent(
        "New Lucky Draw Entry from Website"
      )}&body=${encodeURIComponent(
        `A new entry has been submitted:\n\n----------------------------------------\nFull Name: ${nameInput.value.trim()}\nMobile Number: ${mobileInput.value.trim()}\nCoupon Code: ${couponInput.value.trim()}\n----------------------------------------\n\nThis email was automatically generated from the Nana'S Biryani Mall website.`
      )}`;

      window.location.href = mailtoLink;
      showModal("submission-success-modal");
      form.reset();
    }
  });
}
// --- END OF LUCKY DRAW FEATURE ---

// --- FEATURE: RESERVATION FORM (DEACTIVATED) ---
// To re-enable, uncomment this function and its call in setupFeatureSpecificEventListeners.
/*
function setupReservationForm() {
  const form = document.getElementById("reservation-form");
  if (!form) return;

  const nameInput = document.getElementById("name");
  const dateInput = document.getElementById("date");
  const timeInput = document.getElementById("time");
  const guestsInput = document.getElementById("guests");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFormErrors(form);
    let isValid = true;

    // Validate Name
    if (nameInput.value.trim() === "") {
      showFormError(nameInput, "Please enter your full name.");
      isValid = false;
    }

    // Validate Date
    if (dateInput.value === "") {
      showFormError(dateInput, "Please select a date.");
      isValid = false;
    } else {
      const selectedDate = new Date(dateInput.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare dates only
      if (selectedDate < today) {
        showFormError(dateInput, "Date cannot be in the past.");
        isValid = false;
      }
    }

    // Validate Time
    if (timeInput.value === "") {
      showFormError(timeInput, "Please choose a time.");
      isValid = false;
    }

    // Validate Guests
    if (guestsInput.value === "") {
      showFormError(guestsInput, "Please enter the number of guests.");
      isValid = false;
    } else {
      const guests = parseInt(guestsInput.value, 10);
      const min = parseInt(guestsInput.min, 10);
      const max = parseInt(guestsInput.max, 10);
      if (guests < min || guests > max) {
        showFormError(guestsInput, `Please enter a number between ${min} and ${max}.`);
        isValid = false;
      }
    }

    if (isValid) {
      // If the form were active, submission logic would go here.
      // For now, it just confirms validation works and shows the "unavailable" modal.
      console.log("Reservation form is valid, but feature is disabled.");
      showModal("unavailable-modal");
      form.reset();
    }
  });
}
*/
// --- END OF RESERVATION FEATURE ---

// --- RENDER FUNCTIONS ---
function populateMenu(items) {
  const grid = document.getElementById("menu-grid");
  if (!grid) return;
  grid.innerHTML = items
    .map(
      (item) => `
        <div class="menu-item" data-category="${item.category}">
            <img src="${item.imageSrc}" alt="${item.altText}" loading="lazy">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <span class="price">${item.price}</span>
        </div>`
    )
    .join("");
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function populateReviews(reviews) {
  const grid = document.getElementById("reviews-grid");
  if (!grid) return;
  const NUM_REVIEWS_TO_SHOW = 3;
  const positive = reviews.filter((r) => r.rating >= 4);
  const neutral = reviews.filter((r) => r.rating === 3);
  const negative = reviews.filter((r) => r.rating <= 2);
  let selected = [];
  selected.push(...shuffleArray([...positive]).slice(0, 2));
  if (Math.random() < 0.2 && negative.length > 0) {
    selected.push(shuffleArray([...negative])[0]);
  } else if (neutral.length > 0) {
    selected.push(shuffleArray([...neutral])[0]);
  } else if (positive.length > selected.length) {
    const remaining = positive.filter((p) => !selected.includes(p));
    if (remaining.length > 0) selected.push(shuffleArray(remaining)[0]);
  }
  while (
    selected.length < NUM_REVIEWS_TO_SHOW &&
    reviews.length > selected.length
  ) {
    const remaining = reviews.filter((r) => !selected.includes(r));
    selected.push(shuffleArray(remaining)[0]);
  }
  grid.innerHTML = shuffleArray(selected)
    .map(
      (review) => `
        <div class="review-card">
            <div class="review-header">
                <span class="review-name">${review.name}</span>
                <span class="review-stars">${"★".repeat(
                  review.rating
                )}${"☆".repeat(5 - review.rating)}</span>
            </div>
            <p class="review-quote">"${review.quote}"</p>
        </div>`
    )
    .join("");
}

function populateVideos(videos) {
  const grid = document.getElementById("video-grid");
  if (!grid) return;
  grid.innerHTML = videos
    .map(
      (video) => `
        <a href="https://www.youtube.com/watch?v=${video.videoId}" class="video-link" target="_blank" rel="noopener noreferrer">
            <div class="video-thumbnail">
                <img src="${video.thumbnailSrc}?w=600&q=80" alt="${video.altText}" loading="lazy">
                <div class="play-button">▶</div>
                <p>${video.title}</p>
            </div>
        </a>`
    )
    .join("");
}

// --- CORE EVENT LISTENERS ---
function setupNavbar() {
  const navbar = document.querySelector(".navbar");
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");
  window.addEventListener("scroll", () =>
    navbar.classList.toggle("scrolled", window.scrollY > 50)
  );
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    navbar.classList.toggle("menu-open", isOpen);
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", isOpen);
  });
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (navMenu.classList.contains("open")) {
        navMenu.classList.remove("open");
        navbar.classList.remove("menu-open");
        navToggle.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

function setupNavbarSectionObserver() {
  const navbar = document.querySelector(".navbar");
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".content-section, .hero");
  if (window._navbarSectionObserver) window._navbarSectionObserver.disconnect();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const link = document.querySelector(
            `.nav-link[href="#${entry.target.id}"]`
          );
          navLinks.forEach((l) => l.classList.remove("active"));
          if (link) link.classList.add("active");
        }
      });
    },
    { rootMargin: `-${navbar.offsetHeight}px 0px 0px 0px`, threshold: 0.1 }
  );
  sections.forEach((section) => section.id && observer.observe(section));
  window._navbarSectionObserver = observer;
}

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href.length > 1) {
        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });
}

function setupContentRevealObserver() {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  document
    .querySelectorAll(".content-section")
    .forEach((section) => observer.observe(section));
}

function setupMenuFilter() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const menuItems = document.querySelectorAll(".menu-item");
  if (!filterButtons.length || !menuItems.length) return;
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      const filter = button.dataset.filter;
      menuItems.forEach((item) => {
        item.classList.toggle(
          "hidden",
          filter !== "all" && item.dataset.category !== filter
        );
      });
    });
  });
}

function setupVideoLinks() {
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  document.querySelectorAll(".video-link").forEach((link) => {
    if (isMobile) {
      link.removeAttribute("target");
    }
  });
}
