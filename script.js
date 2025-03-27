const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const promptForm = document.querySelector(".prompt-form");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const galleryGrid = document.querySelector(".gallery-grid");

// Hagging face API key

const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
  "A floating island with waterfalls pouring into clouds below",
  "A witch's cottage in fall with magic herbs in the garden",
  "A robot painting in a sunny studio with art supplies around it",
  "A magical library with floating glowing books and spiral staircases",
  "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
  "A cosmic beach with glowing sand and an aurora in the night sky",
  "A medieval marketplace with colorful tents and street performers",
  "A cyberpunk city with neon signs and flying cars at night",
  "A peaceful bamboo forest with a hidden ancient temple",
  "A giant turtle carrying a village on its back in the ocean",
];

// Set theme based on user's preference or system preference
(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemThemeDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;
  const isDarkTheme = savedTheme === "dark" || !systemThemeDark;

  document.body.classList.toggle("dark-theme", isDarkTheme);
  themeToggle.querySelector("i").className = isDarkTheme
    ? "fas fa-sun"
    : "fas fa-moon";
})();

// Toggle between light and dark theme and save user's preference
const toggleTheme = () => {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  themeToggle.querySelector("i").className = isDarkTheme
    ? "fas fa-sun"
    : "fas fa-moon";
};

// Fill prompt input with a random example prompt
promptBtn.addEventListener("click", () => {
  const prompt =
    examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
  promptInput.value = prompt;
  promptInput.focus();
});

// Get image dimensions based on aspect ratio
const getImageDimensions = (ratio, baseSize = 512) => {
  const [width, height] = ratio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);

  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedHeight = Math.round(height * scaleFactor);

  // Round down to the nearest multiple of 16
  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

  return { width: calculatedWidth, height: calculatedHeight };
};

// Update image card with generated image
const updateImageCard = (index, imgUrl) => {
  const imgCard = document.getElementById(`img-card-${index}`);
  if (!imgCard) return;

  imgCard.classList.remove("loading");
  imgCard.innerHTML = `
  <img src="${imgUrl}" class="result-img" alt="Generated image" />
  <div class="img-overlay">
    <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
      <i class="fa-solid fa-download"></i> 
    </a>
  </div>`;
};

// Generate images using Hugging Face API
const generateImages = async (model, count, ratio, prompt) => {
  const MODEL_URL = `https://router.huggingface.co/hf-inference/models/${model}`;
  const { width, height } = getImageDimensions(ratio);
  console.log(width, height);

  // Create an array of image generation promises
  const imagePromises = Array.from({ length: count }, async (_, i) => {
    // Send request to Hugging Face API
    try {
      const response = await fetch(MODEL_URL, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: prompt,
          parameters: { width, height },
          options: { wait_for_model: true, user_cache: false },
        }),
      });

      if (!response.ok) throw new Error((await response.json())?.error);

      // Convert response to image URL and update image card
      const result = await response.blob();

      updateImageCard(i, URL.createObjectURL(result));
    } catch (error) {
      console.log(error);
      const imgCard = document.getElementById(`img-card-${i}`);
      if (!imgCard) return;
      imgCard.classList.replace("loading", "error");
      imgCard.querySelector(".status-text").textContent =
        "Failed to generate! 😢";
    }
  });

  await Promise.allSettled(imagePromises);
};

// Create placeholder cards for generated images
const createCards = (model, count, ratio, prompt) => {
  galleryGrid.innerHTML = "";

  for (let i = 0; i < count; i++) {
    galleryGrid.innerHTML += `<div class="img-card loading" id="img-card-${i}" style="--aspect-ratio: ${ratio}">
              <div class="status-container">
                <div class="spinner"></div>
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p class="status-text">Generating...</p>
              </div>
            </div>`;
  }

  generateImages(model, count, ratio, prompt);
};
const handleFormSubmit = (e) => {
  e.preventDefault();

  // Get form values
  const selectedModel = modelSelect.value;
  const selectedCount = parseInt(countSelect.value) || 1;
  const selectedRatio = ratioSelect.value || "1:1";
  const promptText = promptInput.value.trim();
  createCards(selectedModel, selectedCount, selectedRatio, promptText);
};

promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);

// https://youtu.be/J5zsvyEfhi4?t=3504
