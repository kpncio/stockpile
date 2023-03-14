/// <reference lib="webworker"/>

import { local, strftime } from "src/app/datetime";

addEventListener('message', ({ data }) => {
  const response = `worker response to ${data}`;
  postMessage(response);

  if (data.eod) {
    for (let i = 0; i < 100; i++) {
      if (data.keys['daily'][data.nextdaily]) {
        data.viewdaily[`${data.keys['daily'][data.nextdaily]}|00:00`] = data.daily[data.keys['daily'][data.nextdaily]];
        data.nextdaily++;
      }
    }
    
    data.vieweddaily = Object.keys(data.viewdaily);
  } else {
    for (let i = 0; i < 100; i++) {
      if (data.keys['intra'][data.nextintra]) {
        const date = new Date(data.keys['intra'][data.nextintra] * 1000);
        data.viewintra[strftime('%Y-%m-%d|%H:%M', local(date))] = data.intra[data.keys['intra'][data.nextintra]];
        data.nextintra++;
      }
    }
    
    data.viewedintra = Object.keys(data.viewintra);
  }

  postMessage({
    vieweddaily: data.vieweddaily,
    viewedintra: data.viewedintra,
    nextdaily: data.nextdaily,
    nextintra: data.nextintra,
    viewdaily: data.viewdaily,
    viewintra: data.viewintra,
    daily: data.daily,
    intra: data.intra,
    eod: data.eod,
    keys: data.keys
  });
});
