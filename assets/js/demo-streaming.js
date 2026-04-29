(function () {
  "use strict";

  function createStageTicker(root) {
    const stages = Array.from(root.querySelectorAll("[data-stage]"));
    let index = 0;
    let timer = 0;

    function start() {
      stop();
      stages.forEach(stage => stage.classList.remove("active"));
      timer = window.setInterval(() => {
        stages.forEach(stage => stage.classList.remove("active"));
        stages[index % stages.length]?.classList.add("active");
        index += 1;
      }, 650);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = 0;
      stages.forEach(stage => stage.classList.remove("active"));
      index = 0;
    }

    return { start, stop };
  }

  window.BrightAIDemoStreaming = {
    createStageTicker
  };
})();
