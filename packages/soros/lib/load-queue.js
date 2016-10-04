const { EventEmitter } = require('events')

function queue ({
  load,
  retry = 3

}) {

  const emitter = new EventEmitter()
  const results = {}

  function add (param, callback) {
    let key

    if (arguments.length === 1) {
      callback = param
      key = ''

    } else {
      key = JSON.stringify(param)
    }

    if (key in results) {
      return callback(...results[key])
    }

    emitter.on(key, callback)

    if (emitter.listerCount(key) === 1) {
      loadResource(param, load, retry)
      .then((data) => {
        results[key] = [null, data]
        emitter.emit(key, null, data)
        emitter.removeAllListeners(key)
      })
      .catch((err) => {
        emitter.emit(key, err)
        // again
        emitter.removeAllListeners(key)
      })
    }
  }

  // expose cache so that we could handle it
  add.cache = results

  return add
}


function loadResource (param, load, retry) {
  -- retry

  return load(param)
  .then((data) => {
    return data
  })
  .catch((err) => {
    if (retry < 0) {
      return Promise.reject(err)
    }

    return loadResource(param, load, retry)
  })
}