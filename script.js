document.addEventListener("DOMContentLoaded", main);

function main() {
  // Setup listeners for static elements that exist on page load
  setupStaticEventListeners();

  // Load dynamic content from JSON files
  loadDynamicContent();
}

/**
 * Sets up all event listeners for static UI elements.
 */
function setupStaticEventListeners() {
  setupNavbar();
  setupSmoothScroll();
  setupContentRevealObserver();
  setupUnavailableFeatureModal(); // Replaces the old reservation form setup
  setupNavbarSectionObserver();
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

    // Setup listeners for the newly created dynamic content
    setupMenuFilter();
    setupVideoLinks();

    // Re-initialize the navbar observer after the browser has had time to reflow.
    // This delay ensures the observer is aware of the new height of the dynamic sections.
    setTimeout(setupNavbarSectionObserver, 100);
  } catch (error) {
    console.error("Failed to load dynamic content:", error);
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

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param {Array} array The array to shuffle.
 * @returns {Array} The shuffled array.
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Populates the reviews grid with a randomized and balanced selection of reviews.
 * This function prioritizes positive reviews, occasionally shows neutral ones,
 * and rarely includes negative ones to maintain authenticity.
 * @param {Array} reviews - An array of review objects.
 */
function populateReviews(reviews) {
  const grid = document.getElementById("reviews-grid");
  if (!grid) return;

  const NUM_REVIEWS_TO_SHOW = 3;

  // 1. Categorize reviews based on their rating
  const positiveReviews = reviews.filter((r) => r.rating >= 4);
  const neutralReviews = reviews.filter((r) => r.rating === 3);
  const negativeReviews = reviews.filter((r) => r.rating <= 2);

  let selectedReviews = [];

  // 2. Prioritize positive reviews (aim for 2 out of 3)
  selectedReviews.push(...shuffleArray([...positiveReviews]).slice(0, 2));

  // 3. Decide on the third review to create a balanced and authentic mix
  const showNegativeChance = 0.2; // 20% chance to show a negative review
  const hasNegativeReviews = negativeReviews.length > 0;
  const hasNeutralReviews = neutralReviews.length > 0;

  if (Math.random() < showNegativeChance && hasNegativeReviews) {
    // Rarely, add a random negative review
    selectedReviews.push(shuffleArray([...negativeReviews])[0]);
  } else if (hasNeutralReviews) {
    // Otherwise, add a random neutral review
    selectedReviews.push(shuffleArray([...neutralReviews])[0]);
  } else if (positiveReviews.length > selectedReviews.length) {
    // As a fallback, add another unique positive review
    const remainingPositives = positiveReviews.filter(
      (p) => !selectedReviews.includes(p)
    );
    if (remainingPositives.length > 0) {
      selectedReviews.push(shuffleArray(remainingPositives)[0]);
    }
  }

  // 4. Ensure there are exactly the desired number of reviews, filling any gaps if necessary
  if (selectedReviews.length < NUM_REVIEWS_TO_SHOW) {
    const allReviews = [...reviews];
    const remainingReviews = allReviews.filter(
      (r) => !selectedReviews.includes(r)
    );
    const shuffledRemainders = shuffleArray(remainingReviews);
    const needed = NUM_REVIEWS_TO_SHOW - selectedReviews.length;
    selectedReviews.push(...shuffledRemainders.slice(0, needed));
  }

  // 5. Shuffle the final selection to ensure random display order
  const finalReviews = shuffleArray(selectedReviews);

  // 6. Render the reviews to the DOM
  grid.innerHTML = finalReviews
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
}

function setupNavbarSectionObserver() {
  const navbar = document.querySelector(".navbar");
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".content-section, .hero");

  if (window._navbarSectionObserver) {
    window._navbarSectionObserver.disconnect();
  }

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
    {
      rootMargin: `-${navbar.offsetHeight}px 0px 0px 0px`,
      // Lower the threshold to trigger with less of the section visible
      threshold: 0.1,
    }
  );
  sections.forEach((section) => {
    if (section.id) sectionObserver.observe(section);
  });
  window._navbarSectionObserver = sectionObserver;
}

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      // Prevent modal triggers from smooth scrolling
      if (["#reservations", "#delivery"].includes(href)) {
        return;
      }
      e.preventDefault();
      const targetElement = document.querySelector(href);
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
  const menuItems = document.querySelectorAll(".menu-item");
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

/**
 * Sets up and manages the "Feature Unavailable" modal.
 */
function setupUnavailableFeatureModal() {
  const modal = document.getElementById("unavailable-modal");
  if (!modal) return;

  const closeModalBtn = modal.querySelector(".modal-close");
  const form = document.getElementById("reservation-form");

  // Elements that will trigger the modal
  const triggers = [
    ...form.querySelectorAll("input"),
    form.querySelector(".form-submit-btn"),
    ...document.querySelectorAll(".delivery-btn"),
  ];

  const validTriggers = triggers.filter((el) => el !== null);

  const showModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => modal.classList.add("visible"), 10);
  };

  const hideModal = () => {
    modal.classList.remove("visible");
    document.body.style.overflow = "";
    const onTransitionEnd = () => {
      modal.hidden = true;
      modal.removeEventListener("transitionend", onTransitionEnd);
    };
    modal.addEventListener("transitionend", onTransitionEnd);
  };

  validTriggers.forEach((trigger) => {
    trigger.addEventListener("click", showModal);
  });

  closeModalBtn.addEventListener("click", hideModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      hideModal();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("visible")) {
      hideModal();
    }
  });
}
