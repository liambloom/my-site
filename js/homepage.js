awaitPageLoad
  .then(() => {
    // TODO: Move scrollbar to body instead of main
    console.log(document.readyState + " " + performance.now()); main.style.width = `calc(100vw + ${main.offsetWidth - main.clientWidth}px)`;
  });
const showScroll = setTimeout(() => {
  document.getElementById("scroll-for-more").style.opacity = "1";
}, 2500);
main.addEventListener("scroll", () => {
  clearTimeout(showScroll);
  document.getElementById("scroll-for-more").style.opacity = "0";
});