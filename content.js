function postCommentUrl() {
  const el = document.querySelector('[data-react-class="Room"]')
  const props = JSON.parse(el.dataset.reactProps)
  const { room_id: roomId, current_participation_id: participationId } = props
  return `https://www.sonicgarden.world/rooms/${roomId}/participations/${participationId}/comments`
}

function fetchOptions() {
  return {
    'credentials': 'include',
    'headers': {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-csrf-token': document.querySelector('meta[name="csrf-token"]')['content']
    }
  }
}

function postComment(content) {
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#xhr_and_fetch
  // In Firefox, extensions that need to perform requests that behave as if they were sent by the content itself can use  content.XMLHttpRequest and content.fetch() instead.
  const fetch = (window.content && window.content.fetch) ? content.fetch : window.fetch;

  return fetch(postCommentUrl(), {
    'method': 'POST',
    'body': JSON.stringify({ comment: { content } }),
    ...fetchOptions()
  })
}

function sample(array) {
  return array[Math.floor(Math.random() * array.length)]
}

const MESSAGES = {
  3: ['めっちゃ歩いてきまーす', '歩きまくってくる', 'たくさん歩くザンス'],
  2: ['歩いてきます〜', '歩くぞ', '歩く！'],
}

const TITLES = ['歩きに行きますかー。', 'どれぐらい歩きます？', '今日どれぐらい歩きました？これからどうします？']

const MODAL_HTML = `
  <div class="js-world-walk-modal">
    <dialog class="js-world-walk-modal">
      <div>%{title}</div>
      <button type="button" class="btn btn-block btn-lg btn-primary mt-4" data-value="3">めっちゃ歩く</button>
      <button type="button" class="btn btn-block btn-sm btn-default mt-3" data-value="2">歩く</button>
      <button type="button" class="btn btn-block btn-xs btn-link mt-2" data-value="1">歩かない</button>
    </dialog>
  </div>
`

function showConfirmModal(handler) {
  const modal = document.querySelector('.js-world-walk-modal')
  if (modal) {
    modal.remove()
  }

  const html = MODAL_HTML.replace('%{title}', sample(TITLES))
  document.body.insertAdjacentHTML('beforeend', html)
  for (const el of document.querySelectorAll('.js-world-walk-modal button')) {
    el.addEventListener('click', (ev) => {
      const btn = ev.currentTarget
      handler(btn.dataset.value)
    })
  }
  document.querySelector('.js-world-walk-modal dialog').showModal()
}

function confirmWalk() {
  return new Promise((resolve) => {
    showConfirmModal(async (val) => {
      const msgs = MESSAGES[val]
      if (msgs) {
        postComment(sample(msgs)).then(resolve)
      } else {
        resolve()
      }
    })
  })
}

let hijack = true
function handleClick(ev) {
  if (!hijack) {
    return
  }

  const logout = ev.currentTarget
  hijack = false
  ev.preventDefault()
  ev.stopPropagation()

  confirmWalk().then(() => {
    logout.click()
    hijack = true
  })
}

function bind() {
  const logout = document.querySelector('#js-logout-link')
  if (logout) {
    logout.addEventListener('click', handleClick)
  } else {
    setTimeout(bind, 3000)
  }
}

bind()
