awaitPageLoad
  .then(() => {
    // TODO: Move scrollbar to body instead of main
    console.log(document.readyState + " " + performance.now()); main.style.width = `calc(100vw + ${main.offsetWidth - main.clientWidth}px)`;
  });

// TODO: Move this code to the scroll-for-more file
const showScroll = setTimeout(() => {
  document.getElementById("scroll-for-more").style.opacity = "1";
}, 2500);
function scrollCallback() {
  clearTimeout(showScroll);
  document.getElementById("scroll-for-more").style.opacity = "0";
  main.removeEventListener("scroll", scrollCallback);
}
main.addEventListener("scroll", scrollCallback);