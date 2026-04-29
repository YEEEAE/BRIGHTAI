(function () {
  "use strict";

  var emailNode = document.getElementById("contact-email");
  if (emailNode) {
    emailNode.innerText = "yazeed1job" + "@" + "gmail.com";
  }

  var header = document.getElementById("main-header");
  if (header) {
    var syncHeaderState = function () {
      header.classList.toggle("nav-scrolled", window.scrollY > 24);
    };
    syncHeaderState();
    window.addEventListener("scroll", syncHeaderState, { passive: true });
  }

  var progressBar = document.getElementById("readingProgress");
  if (progressBar) {
    window.addEventListener(
      "scroll",
      function () {
        var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        var scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        var scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        progressBar.style.width = scrollPercent + "%";
      },
      { passive: true }
    );
  }

  document.querySelectorAll("[data-brightai-whatsapp-share]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var shareUrl = "https://wa.me/?text=" + encodeURIComponent(document.title + " " + window.location.href);
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    });
  });

  document.querySelectorAll("[data-brightai-share]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var target = link.getAttribute("data-brightai-share");
      var shareUrl = "";

      if (target === "twitter") {
        shareUrl =
          "https://twitter.com/intent/tweet?text=" +
          encodeURIComponent(document.title) +
          "&url=" +
          encodeURIComponent(window.location.href);
      }

      if (target === "linkedin") {
        shareUrl =
          "https://www.linkedin.com/sharing/share-offsite/?url=" +
          encodeURIComponent(window.location.href);
      }

      if (shareUrl) {
        window.open(shareUrl, "_blank", "noopener,noreferrer");
      }
    });
  });
})();
