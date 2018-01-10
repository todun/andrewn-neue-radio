const DEBUG =
  new URL(window.location.href).searchParams.get('debug') === 'true';

const createComms = async handler => {
  const ws = new WebSocket('ws://' + location.hostname + ':8000');

  const send = (topic, payload) => {
    ws.send(
      JSON.stringify({
        topic,
        payload
      })
    );
  };

  const instance = {
    downloadMedia: url => {
      DEBUG
        ? handler({ topic: 'mediaAvailable', payload: { url } })
        : send('mediaRequest', { url });
    },
    playing: url => {
      send('playing', { url });
    },
    stopped: () => {
      send('stopped', {});
    }
  };

  ws.addEventListener('message', function(evt) {
    const msg = JSON.parse(evt.data);
    handler(msg);
  });

  return new Promise(resolve => {
    ws.addEventListener('open', function() {
      resolve(instance);
    });
  });
};

const playMedia = url => {
  const mediaEl = document.querySelector('.media');
  mediaEl.src = url;
  mediaEl.play();
};

const stopMedia = () => {
  const mediaEl = document.querySelector('.media');
  mediaEl.pause();
};

const handleMessage = comms => ({ topic, payload }) => {
  console.log(topic, payload);
  switch (topic) {
    case 'requestPlay':
      comms.downloadMedia(payload.url);
      break;
    case 'requestStop':
      stopMedia();
      comms.stopped();
      break;
    case 'mediaAvailable':
      playMedia(payload.url);
      comms.playing(payload.sourceUrl);
      break;
  }
};

const init = async () => {
  console.log('YouTube app:init. DEBUG? ', DEBUG);
  const comms = await createComms(msg => handleMessage(comms)(msg));
};

init();
