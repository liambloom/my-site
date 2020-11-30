awaitPageLoad
  .then(() => {
    console.log(document.readyState + " " + performance.now()); main.style.width = `calc(100vw + ${main.offsetWidth - main.clientWidth}px)`;
  });
document.querySelector("#welcome > div:first-of-type").style.animation = "spread 1.75s ease forwards, glow 3s ease-in-out forwards";
const showScroll = setTimeout(() => {
  document.getElementById("scroll-for-more").style.opacity = "1";
}, 2500);
main.addEventListener("scroll", () => {
  clearTimeout(showScroll);
  document.getElementById("scroll-for-more").style.opacity = "0";
});