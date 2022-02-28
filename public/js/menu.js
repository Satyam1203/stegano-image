let wrap = document.querySelector('.wrap')
let menuBtn = document.querySelectorAll('.menuBtn')

let resize = () => {
  let wrap = document.querySelector('.wrap')
  console.log(window.innerWidth)
  if (window.innerWidth < 800) wrap.classList.add('closedMenu')
  else wrap.classList.remove('closedMenu')
}

let openCLoseMenu = () => {
  let wrap = document.querySelector('.wrap')
  if(wrap.classList.contains('closedMenu')) wrap.classList.remove('closedMenu')
  else wrap.classList.add('closedMenu')
}

window.addEventListener('resize', (e) => {
  resize()
})

window.addEventListener('load', (e) => {
  resize()
})

menuBtn[0].addEventListener('click', (e) => {
  openCLoseMenu()
})

