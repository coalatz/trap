
  // ---- Countdown to 28/08/2026 ----
  const target = new Date("2026-08-28T20:00:00-03:00").getTime();
  function tick(){
    const now = Date.now();
    let diff = Math.max(0, target - now);
    const d = Math.floor(diff/(1000*60*60*24));
    const h = Math.floor((diff/(1000*60*60))%24);
    const m = Math.floor((diff/(1000*60))%60);
    const s = Math.floor((diff/1000)%60);
    document.getElementById('cd-days').textContent = String(d).padStart(2,'0');
    document.getElementById('cd-hours').textContent = String(h).padStart(2,'0');
    document.getElementById('cd-mins').textContent = String(m).padStart(2,'0');
    document.getElementById('cd-secs').textContent = String(s).padStart(2,'0');
  }
  tick();
  setInterval(tick, 1000);

  // ---- Scroll reveal ----
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('in'); });
  }, {threshold:0.15});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

  // ---- Mobile-first event gallery ----
  const eventCarousel = document.getElementById('event-carousel');
  if(eventCarousel){
    const slides = Array.from(eventCarousel.querySelectorAll('.event-slide'));
    const prevButton = document.querySelector('[data-carousel-prev]');
    const nextButton = document.querySelector('[data-carousel-next]');
    const currentLabel = document.getElementById('event-carousel-current');
    const totalLabel = document.getElementById('event-carousel-total');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let activeIndex = 0;
    let scrollFrame = 0;

    if(totalLabel) totalLabel.textContent = String(slides.length).padStart(2, '0');

    function updateCarousel(index){
      activeIndex = Math.max(0, Math.min(index, slides.length - 1));
      if(currentLabel) currentLabel.textContent = String(activeIndex + 1).padStart(2, '0');
      prevButton.disabled = activeIndex === 0;
      nextButton.disabled = activeIndex === slides.length - 1;
      slides.forEach((slide, slideIndex)=>{
        if(slideIndex === activeIndex) slide.setAttribute('aria-current', 'true');
        else slide.removeAttribute('aria-current');
      });
    }

    function goToSlide(index){
      const nextIndex = Math.max(0, Math.min(index, slides.length - 1));
      const left = slides[nextIndex].offsetLeft - slides[0].offsetLeft;
      eventCarousel.scrollTo({
        left,
        behavior:reduceMotion ? 'auto' : 'smooth'
      });
      updateCarousel(nextIndex);
    }

    function getClosestSlide(){
      const firstOffset = slides[0].offsetLeft;
      return slides.reduce((closestIndex, slide, index)=>{
        const currentDistance = Math.abs((slide.offsetLeft - firstOffset) - eventCarousel.scrollLeft);
        const closestDistance = Math.abs((slides[closestIndex].offsetLeft - firstOffset) - eventCarousel.scrollLeft);
        return currentDistance < closestDistance ? index : closestIndex;
      }, 0);
    }

    prevButton.addEventListener('click', ()=>goToSlide(activeIndex - 1));
    nextButton.addEventListener('click', ()=>goToSlide(activeIndex + 1));
    eventCarousel.addEventListener('keydown', (event)=>{
      if(event.key === 'ArrowLeft'){
        event.preventDefault();
        goToSlide(activeIndex - 1);
      }
      if(event.key === 'ArrowRight'){
        event.preventDefault();
        goToSlide(activeIndex + 1);
      }
    });
    eventCarousel.addEventListener('scroll', ()=>{
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(()=>updateCarousel(getClosestSlide()));
    }, {passive:true});

    updateCarousel(0);
  }

// ---- Background Music ----
if (window.self === window.top) {
  var bgMusic = document.getElementById('bg-music');
  if (bgMusic) {
    bgMusic.volume = 0.5;
  }
  
  function startMusic() {
    if (bgMusic) {
      bgMusic.play().catch(function(err) {
        console.warn("Audio play blocked:", err);
      });
      document.removeEventListener('click', startMusic);
      document.removeEventListener('touchstart', startMusic);
    }
  }
  document.addEventListener('click', startMusic);
  document.addEventListener('touchstart', startMusic);
}
