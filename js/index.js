const API_KEY = 'AIzaSyCYk3FFcQ6RztLKGwjKwsznGlIQOa7jQy4';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

const videoListItems = document.querySelector('.video-list__items');

const fetchTrendingVideos = async () => {
    try {
        const url = new URL(VIDEOS_URL);
        url.searchParams.append('part', 'id,contentDetails,snippet');
        url.searchParams.append('chart', 'mostPopular');
        url.searchParams.append('regionCode', 'RU');
        url.searchParams.append('maxResults', 12);
        url.searchParams.append('key', API_KEY);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('error : ', error);
    }
}

const displayVideos = (videos) => {
    videoListItems.textContent = '';
    const videoList = videos.items.map(video => {
        const li = document.createElement('li');
        li.classList.add('video-list__item');
        li.innerHTML = `
        <article class="video-card">
            <a href="/video.html?id=${video.id}" class="video-card__link">
                <img src="${video.snippet.thumbnails.high?.url || 
                            video.snippet.thumbnails.standart?.url}" alt="Превью видео ${video.snippet.title}"
                    class="video-card__thumbnail">
                <h3 class="video-card__title">${video.snippet.title}</h3>
                <p class="video-card__channel">${video.snippet.channelTitle}</p>
                <p class="video-card__duration">${getCorrectDurationTime(video.contentDetails.duration)}</p>
            </a>
            <button class="video-card__favorite " type="button" aria-label="Добавить в избранное">
                <svg class="favorite__icon">
                    <use class="star-o" xlink:href="/image/sprite.svg#star-ob" />
                    <use class="star" xlink:href="/image/sprite.svg#star" />
                </svg> 
            </button>
        </article>
        `;
        return li;
    });
    videoListItems.append(...videoList);
}

const getCorrectDurationTime = (duration) => {
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
 
    duration = duration.replace('PT','');
 
    if (duration.indexOf('H') > -1) {
        var hours_split = duration.split('H');
        hours = parseInt(hours_split[0]);
        duration  = hours_split[1];
    }
 
    if (duration.indexOf('M') > -1) {
        var minutes_split = duration.split('M');
        minutes = parseInt(minutes_split[0]);
        duration = minutes_split[1];
    }
 
    if (duration.indexOf('S') > -1) {
        var seconds_split = duration.split('S');
        seconds = parseInt(seconds_split[0]);
    }
 
    let str = "";
    
    if (hours != 0 && hours == 1) { str += hours + " час "; }
    if (hours != 0 && hours >= 2) { str += hours + " часa "; }
    if (minutes == 0) { str += "00" +  " мин "; }
    else if (minutes < 10) { str += "0" + minutes + " мин "; }
    else if (minutes > 10) { str += minutes + " мин "; }
 
    if (seconds > 0 && seconds < 10) { str += "0" + seconds + " сек"; }
    else if (seconds < 10) { str += "0" + seconds + " сек"; }
    else if (seconds > 10) { str += seconds + " сек"; }
 
    return str;
}

fetchTrendingVideos().then(displayVideos);