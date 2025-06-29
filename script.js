document.addEventListener("DOMContentLoaded", main);

function main() {
  // Setup listeners for static elements that exist on page load
  setupStaticEventListeners();

  // Load dynamic content from JSON files
  loadDynamicContent();
}

/**
 * Sets up all event listeners for static UI elements like the navbar.
 */
function setupStaticEventListeners() {
  setupNavbar();
  setupSmoothScroll();
  setupContentRevealObserver();
  setupReservationForm();
}

/**
 * Fetches data from JSON files and populates the page.
 */
async function loadDynamicContent() {
  try {
    const [menuData, reviewData, videoData] = await Promise.all([
      fetch("data/menu.json").then((res) => res.json()),
      fetch("data/reviews.json").then((res) => res.json()),
      fetch("data/videos.json").then((res) => res.json()),
    ]);

    populateMenu(menuData);
    populateReviews(reviewData);
    populateVideos(videoData);

    // Setup listeners for the newly created dynamic content
    setupMenuFilter();
    setupVideoLinks();
  } catch (error) {
    console.error("Failed to load dynamic content:", error);
    // In a real app, display a user-friendly error message
  }
}

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
        </div>
    `
    )
    .join("");
}

function populateReviews(reviews) {
  const grid = document.getElementById("reviews-grid");
  if (!grid) return;
  const sortedReviews = [...reviews]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
  grid.innerHTML = sortedReviews
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
        </div>
    `
    )
    .join("");
}

function populateVideos(videos) {
  const grid = document.getElementById("video-grid");
  if (!grid) return;
  grid.innerHTML = videos
    .map(
      (video) => `
        <a href="https://www.youtube.com/watch?v=${video.videoId}" class="video-link">
            <div class="video-thumbnail">
                <img src="${video.thumbnailSrc}?w=600&q=80" alt="${video.altText}" loading="lazy">
                <div class="play-button">▶</div>
                <p>${video.title}</p>
            </div>
        </a>
    `
    )
    .join("");
}

// --- EVENT LISTENER SETUP FUNCTIONS ---
function setupNavbar() {
  const navbar = document.querySelector(".navbar");
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  });

  navToggle.addEventListener("click", () => {
    const isOpened = navMenu.classList.toggle("open");
    navbar.classList.toggle("menu-open", isOpened);
    navToggle.classList.toggle("open", isOpened);
    navToggle.setAttribute("aria-expanded", isOpened);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (navMenu.classList.contains("open")) {
        navMenu.classList.remove("open");
        navbar.classList.remove("menu-open");
        navToggle.classList.remove("open");
        navToggle.setAttribute("aria-expanded", false);
      }
    });
  });

  const sections = document.querySelectorAll(".content-section, .hero");
  const sectionObserver = new IntersectionObserver(
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
    { rootMargin: `-${navbar.offsetHeight}px 0px 0px 0px`, threshold: 0.4 }
  );
  sections.forEach((section) => {
    if (section.id) sectionObserver.observe(section);
  });
}

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetElement = document.querySelector(this.getAttribute("href"));
      if (targetElement) targetElement.scrollIntoView({ behavior: "smooth" });
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
  const menuItems = document.querySelectorAll(".menu-item"); // Re-select after populating
  if (filterButtons.length === 0 || menuItems.length === 0) return;

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
    if (!isMobile) link.setAttribute("target", "_blank");
  });
}

function setupReservationForm() {
  const form = document.getElementById("reservation-form");
  if (!form) return;
  document.getElementById("date").min = new Date().toISOString().split("T")[0];
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let isValid = true;
    form.querySelectorAll("input[required]").forEach((input) => {
      const isInvalid = !input.checkValidity() || input.value.trim() === "";
      input.classList.toggle("error", isInvalid);
      isValid = !isInvalid && isValid;
    });
    if (isValid) {
      alert(
        "Reservation submitted successfully! We will contact you shortly to confirm."
      );
      form.reset();
    }
  });
}
