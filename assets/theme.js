document.addEventListener('DOMContentLoaded',()=>{
  const menuBtn=document.querySelector('[data-menu-toggle]');
  const mobileMenu=document.querySelector('[data-mobile-menu]');
  if(menuBtn&&mobileMenu){menuBtn.addEventListener('click',()=>mobileMenu.classList.toggle('is-open'));}

  // Header compacts very slightly after scroll, like the reference storefront.
  const header=document.querySelector('[data-header]');
  const onScroll=()=>{if(header)header.classList.toggle('is-scrolled',window.scrollY>20)};
  onScroll(); window.addEventListener('scroll',onScroll,{passive:true});

  // Soft scroll-reveal animations across all storefront sections.
  const revealTargets=document.querySelectorAll('.pp-reveal,.pp-section,.pp-why,.pp-closing,.pp-collection-hero,.pp-pdp__top,.pp-care-guide,.pp-recommendations,.live-hero');
  revealTargets.forEach(el=>el.classList.add('pp-reveal'));
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
    revealTargets.forEach(el=>io.observe(el));
  } else revealTargets.forEach(el=>el.classList.add('is-visible'));

  // Gentle parallax for designated visual zones.
  const floatZones=document.querySelectorAll('[data-float-zone],.pp-hero__products,.pp-spotlight__visual,.pp-treat__media');
  window.addEventListener('pointermove',e=>{
    const x=(e.clientX/window.innerWidth-.5); const y=(e.clientY/window.innerHeight-.5);
    floatZones.forEach(zone=>{zone.style.setProperty('--mx',`${x*10}px`);zone.style.setProperty('--my',`${y*8}px`);});
  },{passive:true});

  // PDP gallery thumbnails.
  document.querySelectorAll('[data-pdp-gallery]').forEach(gallery=>{
    const main=gallery.querySelector('[data-pdp-main]');
    gallery.querySelectorAll('[data-media-src]').forEach(btn=>btn.addEventListener('click',()=>{
      if(!main)return; main.classList.add('is-changing');
      setTimeout(()=>{main.src=btn.dataset.mediaSrc;main.alt=btn.dataset.mediaAlt||main.alt;main.classList.remove('is-changing')},120);
      gallery.querySelectorAll('[data-media-src]').forEach(x=>x.classList.remove('is-active'));btn.classList.add('is-active');
    }));
  });

  // Quantity controls.
  document.querySelectorAll('[data-qty]').forEach(q=>{
    const input=q.querySelector('input');
    q.querySelector('[data-qty-minus]')?.addEventListener('click',()=>input.value=Math.max(1,(parseInt(input.value)||1)-1));
    q.querySelector('[data-qty-plus]')?.addEventListener('click',()=>input.value=(parseInt(input.value)||1)+1);
  });

  // Keep the visible PDP price in sync with the selected Shopify variant.
  document.querySelectorAll('[data-variant-select]').forEach(select=>{
    select.addEventListener('change',()=>{
      const price=select.closest('.pp-pdp__info')?.querySelector('[data-product-price]');
      const option=select.options[select.selectedIndex];
      if(price&&option?.dataset.price)price.textContent=option.dataset.price;
    });
  });

  // Shop-all filters/search. Product type is matched loosely so common Shopify type names still work.
  const search=document.querySelector('[data-product-search]');
  const filterButtons=[...document.querySelectorAll('[data-filter]')];
  const items=[...document.querySelectorAll('[data-product-item]')];
  const count=document.querySelector('[data-result-count]');
  let active='all';
  const applyFilters=()=>{
    const q=(search?.value||'').trim().toLowerCase(); let visible=0;
    items.forEach(item=>{
      const type=(item.dataset.productType||'').toLowerCase(); const text=(item.dataset.productTitle||'').toLowerCase();
      const typeMatch=active==='all'||type.includes(active); const textMatch=!q||text.includes(q);
      const show=typeMatch&&textMatch; item.hidden=!show; if(show)visible++;
    });
    if(count){const label=count.dataset.label||'products';count.textContent=`${visible} ${label}`;}
  };
  search?.addEventListener('input',applyFilters);
  filterButtons.forEach(btn=>btn.addEventListener('click',()=>{active=btn.dataset.filter;filterButtons.forEach(x=>x.classList.remove('is-active'));btn.classList.add('is-active');applyFilters()}));
});


// ===== Pups & Paws V5 conversion interactions =====
(()=>{
  const money=(cents)=>{try{return new Intl.NumberFormat(document.documentElement.lang||'en-IN',{style:'currency',currency:(window.Shopify?.currency?.active||'INR')}).format(cents/100)}catch(e){return `₹${(cents/100).toFixed(2)}`}};
  const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const flyProductToCart=(form,button)=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
    const cart=document.querySelector('[data-cart-open]');
    const productRoot=form.closest('.pp-card,[data-product-root],.pp-product-card,.product-card,.pp-byob');
    const image=productRoot?.querySelector('[data-pdp-main],.pp-card__media img,.pp-product-card__image img,.product-card img,.pp-byob__product.is-selected img');
    if(!cart||!image)return Promise.resolve();

    const from=image.getBoundingClientRect();
    const to=cart.getBoundingClientRect();
    if(!from.width||!from.height||!to.width||!to.height)return Promise.resolve();

    const flyer=image.cloneNode(true);
    flyer.removeAttribute('loading');
    flyer.removeAttribute('id');
    flyer.removeAttribute('data-pdp-main');
    flyer.setAttribute('aria-hidden','true');
    flyer.className='pp-cart-flyer';
    Object.assign(flyer.style,{
      left:`${from.left}px`,top:`${from.top}px`,width:`${from.width}px`,height:`${from.height}px`
    });
    document.body.appendChild(flyer);

    const dx=to.left+to.width/2-(from.left+from.width/2);
    const dy=to.top+to.height/2-(from.top+from.height/2);
    const endScale=Math.max(.035,Math.min(.16,Math.min(to.width/from.width,to.height/from.height)*.72));
    const animation=flyer.animate([
      {transform:'translate3d(0,0,0) scale(1) rotate(0deg)',opacity:1,offset:0},
      {transform:`translate3d(${dx*.18}px,${dy*.08-22}px,0) scale(.88) rotate(-2deg)`,opacity:1,offset:.2},
      {transform:`translate3d(${dx*.68}px,${dy*.48-72}px,0) scale(.42) rotate(5deg)`,opacity:.96,offset:.66},
      {transform:`translate3d(${dx}px,${dy}px,0) scale(${endScale}) rotate(9deg)`,opacity:.15,offset:1}
    ],{duration:760,easing:'cubic-bezier(.22,.8,.24,1)',fill:'forwards'});

    return animation.finished.catch(()=>{}).then(()=>{
      flyer.remove();
      cart.classList.remove('pp-cart-received');
      void cart.offsetWidth;
      cart.classList.add('pp-cart-received');
      window.setTimeout(()=>cart.classList.remove('pp-cart-received'),520);
    });
  };
  async function renderCart(open=true){
    const drawer=document.querySelector('[data-cart-drawer]'); if(!drawer)return;
    const body=drawer.querySelector('[data-cart-drawer-body]'), foot=drawer.querySelector('[data-cart-drawer-foot]');
    const cart=await fetch('/cart.js').then(r=>r.json());
    if(!cart.item_count){body.innerHTML='<div class="pp-cart-empty"><b>Care bag is empty.</b><p>Time to add something cuddle-approved.</p><a class="pp-btn pp-btn--orange" href="/collections/all">Shop all</a></div>';foot.hidden=true}
    else{body.innerHTML=cart.items.map((i,idx)=>{const props=Object.entries(i.properties||{}).filter(([key,value])=>value&&key.charAt(0)!=='_').map(([key,value])=>`<small class="pp-cart-item__property"><b>${escapeHtml(key)}:</b> ${escapeHtml(value)}</small>`).join('');return `<div class="pp-cart-item"><a href="${i.url}" class="pp-cart-item__image">${i.image?`<img src="${i.image}" alt="">`:''}</a><div><a href="${i.url}"><strong>${i.product_title}</strong></a>${i.variant_title&&i.variant_title!=='Default Title'?`<small>${i.variant_title}</small>`:''}${props}<span>${money(i.final_line_price)}</span><div class="pp-cart-item__qty"><button data-cart-change="${idx+1}" data-delta="-1">−</button><b>${i.quantity}</b><button data-cart-change="${idx+1}" data-delta="1">+</button><button class="pp-cart-item__remove" data-cart-remove="${idx+1}">Remove</button></div></div></div>`}).join('');foot.hidden=false;foot.querySelector('[data-cart-subtotal]').textContent=money(cart.total_price)}
    document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent=cart.item_count);
    if(open){drawer.classList.add('is-open');drawer.setAttribute('aria-hidden','false');document.body.classList.add('pp-no-scroll')}
  }
  document.addEventListener('click',async e=>{
    if(e.target.closest('[data-cart-open]')){e.preventDefault();renderCart(true)}
    if(e.target.closest('[data-cart-close]')){const d=document.querySelector('[data-cart-drawer]');d?.classList.remove('is-open');d?.setAttribute('aria-hidden','true');document.body.classList.remove('pp-no-scroll')}
    const ch=e.target.closest('[data-cart-change]'); if(ch){const row=ch.closest('.pp-cart-item'); const q=Number(row?.querySelector('.pp-cart-item__qty b')?.textContent||1)+Number(ch.dataset.delta);await fetch('/cart/change.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({line:Number(ch.dataset.cartChange),quantity:Math.max(0,q)})});renderCart(false)}
    const rm=e.target.closest('[data-cart-remove]'); if(rm){await fetch('/cart/change.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({line:Number(rm.dataset.cartRemove),quantity:0})});renderCart(false)}
  });
  document.addEventListener('submit',async e=>{
    const form=e.target.closest('form[action*="/cart/add"]'); if(!form)return;
    e.preventDefault(); const btn=form.querySelector('[type="submit"]'); const old=btn?.innerHTML; if(btn){btn.disabled=true;btn.textContent='Adding…'}
    try{
      const flight=flyProductToCart(form,btn);
      const response=await fetch('/cart/add.js',{method:'POST',headers:{'Accept':'application/json'},body:new FormData(form)});
      if(!response.ok)throw new Error(`Cart add failed: ${response.status}`);
      await flight;
      await renderCart(true);
    }catch(err){console.error(err);form.submit()}finally{if(btn){btn.disabled=false;btn.innerHTML=old}}
  });

  document.querySelectorAll('[data-pdp-gallery]').forEach(g=>{
    const main=g.querySelector('[data-pdp-main]'), thumbs=[...g.querySelectorAll('[data-media-src]')], current=g.querySelector('[data-media-current]'); let idx=0;
    const show=n=>{if(!thumbs.length||!main)return;idx=(n+thumbs.length)%thumbs.length;const t=thumbs[idx];main.classList.add('is-changing');setTimeout(()=>{main.src=t.dataset.mediaSrc;main.alt=t.dataset.mediaAlt||'';main.classList.remove('is-changing')},100);thumbs.forEach(x=>x.classList.remove('is-active'));t.classList.add('is-active');if(current)current.textContent=idx+1};
    thumbs.forEach((t,i)=>t.addEventListener('click',()=>show(i)));g.querySelector('[data-media-prev]')?.addEventListener('click',()=>show(idx-1));g.querySelector('[data-media-next]')?.addEventListener('click',()=>show(idx+1));
    let sx=0;g.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});g.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>45)show(idx+(dx<0?1:-1))},{passive:true});
    g.querySelector('[data-media-lightbox]')?.addEventListener('click',()=>{const lb=document.querySelector('[data-lightbox]');const img=lb?.querySelector('[data-lightbox-image]');if(lb&&img){img.src=main.src;img.alt=main.alt;lb.classList.add('is-open');lb.setAttribute('aria-hidden','false');document.body.classList.add('pp-no-scroll')}});
  });
  document.querySelectorAll('[data-lightbox-close]').forEach(b=>b.addEventListener('click',()=>{const lb=b.closest('[data-lightbox]');lb?.classList.remove('is-open');lb?.setAttribute('aria-hidden','true');document.body.classList.remove('pp-no-scroll')}));
  document.querySelectorAll('[data-variant-select]').forEach(sel=>sel.addEventListener('change',()=>{const opt=sel.options[sel.selectedIndex],root=sel.closest('[data-product-root]');if(opt.dataset.image){const main=root?.querySelector('[data-pdp-main]');if(main)main.src=opt.dataset.image}root?.querySelectorAll('[data-sticky-price]').forEach(x=>x.textContent=opt.dataset.price||x.textContent)}));
  document.querySelectorAll('[data-sticky-add]').forEach(btn=>btn.addEventListener('click',()=>btn.closest('[data-product-root]')?.querySelector('.pp-pdp__form [type="submit"]')?.click()));

  const popup=document.querySelector('[data-site-popup]'); if(popup){const freq=popup.dataset.frequency, key='pp_popup_seen', now=Date.now(), seen=Number(localStorage.getItem(key)||0), session=sessionStorage.getItem(key);let ok=freq==='always'||(freq==='session'&&!session)||(freq==='7days'&&now-seen>604800000);if(ok)setTimeout(()=>{popup.classList.add('is-open');popup.setAttribute('aria-hidden','false');if(freq==='session')sessionStorage.setItem(key,'1');if(freq==='7days')localStorage.setItem(key,String(now))},Number(popup.dataset.delay||4000));popup.querySelectorAll('[data-popup-close]').forEach(x=>x.addEventListener('click',()=>{popup.classList.remove('is-open');popup.setAttribute('aria-hidden','true')}))}
})();

// Accessible, editor-configurable testimonial carousels.
document.querySelectorAll('[data-review-carousel]').forEach(carousel=>{
  const track=carousel.querySelector('[data-review-track]');
  const cards=[...carousel.querySelectorAll('.live-note')];
  if(!track||cards.length<2)return;
  const prev=carousel.querySelector('[data-review-prev]');
  const next=carousel.querySelector('[data-review-next]');
  const dotsWrap=carousel.querySelector('[data-review-dots]');
  let timer;
  const perView=()=>Math.max(1,Math.round(track.clientWidth/cards[0].getBoundingClientRect().width));
  const pageCount=()=>Math.ceil(cards.length/perView());
  const currentPage=()=>Math.min(pageCount()-1,Math.round(track.scrollLeft/track.clientWidth));
  const drawDots=()=>{
    if(!dotsWrap)return;
    dotsWrap.innerHTML='';
    for(let i=0;i<pageCount();i++){
      const dot=document.createElement('button');
      dot.type='button';dot.setAttribute('aria-label',`Show review page ${i+1}`);
      dot.addEventListener('click',()=>go(i));dotsWrap.appendChild(dot);
    }
    updateDots();
  };
  const updateDots=()=>dotsWrap?.querySelectorAll('button').forEach((dot,i)=>dot.classList.toggle('is-active',i===currentPage()));
  const go=page=>track.scrollTo({left:Math.max(0,Math.min(page,pageCount()-1))*track.clientWidth,behavior:'smooth'});
  const step=direction=>go((currentPage()+direction+pageCount())%pageCount());
  prev?.addEventListener('click',()=>step(-1));next?.addEventListener('click',()=>step(1));
  track.addEventListener('scroll',()=>requestAnimationFrame(updateDots),{passive:true});
  const start=()=>{if(carousel.dataset.autoplay==='true'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){stop();timer=setInterval(()=>step(1),Number(carousel.dataset.interval)||6000)}};
  const stop=()=>clearInterval(timer);
  carousel.addEventListener('mouseenter',stop);carousel.addEventListener('mouseleave',start);
  carousel.addEventListener('focusin',stop);carousel.addEventListener('focusout',start);
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(drawDots,120)},{passive:true});
  drawDots();start();
});

// Editor-controlled Build Your Own Box selection flow.
document.querySelectorAll('[data-build-box]').forEach(builder=>{
  const required=Number(builder.dataset.required||0);
  const choices=[...builder.querySelectorAll('[data-box-choice]')];
  const slots=[...builder.querySelectorAll('[data-box-slot]')];
  const count=builder.querySelector('[data-box-count]');
  const status=builder.querySelector('[data-box-status]');
  const submit=builder.querySelector('[data-box-submit]');
  const contents=builder.querySelector('[data-box-contents]');
  const variantIds=builder.querySelector('[data-box-variant-ids]');
  let selected=[];

  const draw=()=>{
    choices.forEach(choice=>{
      const active=selected.includes(choice);
      choice.classList.toggle('is-selected',active);
      choice.setAttribute('aria-pressed',String(active));
    });
    slots.forEach((slot,index)=>{
      const choice=selected[index];
      slot.classList.toggle('is-filled',Boolean(choice));
      const label=slot.querySelector('small');
      if(label){
        if(!label.dataset.empty)label.dataset.empty=label.textContent;
        label.textContent=choice?choice.dataset.productTitle:label.dataset.empty;
      }
    });
    if(count)count.textContent=selected.length;
    if(contents)contents.value=selected.map(x=>x.dataset.productTitle).join(' | ');
    if(variantIds)variantIds.value=selected.map(x=>x.dataset.variantId).join(', ');
    if(submit)submit.disabled=selected.length!==required;
    if(status)status.textContent=selected.length===required?'Your box is ready to add.':`Choose ${required-selected.length} more ${required-selected.length===1?'product':'products'} to complete your box.`;
  };

  choices.forEach(choice=>choice.addEventListener('click',()=>{
    const index=selected.indexOf(choice);
    if(index>-1)selected.splice(index,1);
    else if(selected.length<required)selected.push(choice);
    else{
      builder.classList.remove('pp-byob-limit');
      void builder.offsetWidth;
      builder.classList.add('pp-byob-limit');
      window.setTimeout(()=>builder.classList.remove('pp-byob-limit'),400);
    }
    draw();
  }));
  draw();
});

