const API_KEY = 'AIzaSyCYk3FFcQ6RztLKGwjKwsznGlIQOa7jQy4';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

const videoListItems = document.querySelector('.video-list__items');

const favouriteIds = JSON.parse(localStorage.getItem('favouriteVideos') || "[]");
const currentPage = location.pathname.split("/").pop();

const fetchTrendingVideos = async (amount) => {
    try {
        const url = new URL(VIDEOS_URL);
        url.searchParams.append('part', 'id,contentDetails,snippet');
        url.searchParams.append('chart', 'mostPopular');
        url.searchParams.append('regionCode', 'RU');
        url.searchParams.append('maxResults', amount);
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

const fetchFavouriteVideos = async () => {
    try {
        const url = new URL(VIDEOS_URL);

        if (favouriteIds.length === 0) {
            return {items: []};
        }

        url.searchParams.append('part', 'id,contentDetails,snippet');
        url.searchParams.append('maxResults', 12);
        url.searchParams.append('id', favouriteIds.join(","));
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

const fetchChosenVideo = async (id) => {
    try {
        const url = new URL(VIDEOS_URL);

        url.searchParams.append('part', 'snippet,statistics');
        url.searchParams.append('id', id);
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

const displayVideoList = (videos) => {
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
                <p class="video-card__duration">${convertDuration(video.contentDetails.duration)}</p>
            </a>
            <button class="video-card__favorite favorite ${
                favouriteIds.includes(video.id) ? 'active' : ''
            }" type="button" aria-label="Добавить в избранное" data-video-id="${video.id}">
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

const displaySimilarList = (videos, videoId) => {
    videoListItems.textContent = '';

    const videoList = videos.items.map(video => {
        if (video.id !== videoId) {
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
                <p class="video-card__duration">${convertDuration(video.contentDetails.duration)}</p>
            </a>
            <button class="video-card__favorite favorite ${
                favouriteIds.includes(video.id) ? 'active' : ''
            }" type="button" aria-label="Добавить в избранное" data-video-id="${video.id}">
                <svg class="favorite__icon">
                    <use class="star-o" xlink:href="/image/sprite.svg#star-ob" />
                    <use class="star" xlink:href="/image/sprite.svg#star" />
                </svg>
            </button>
        </article>
        `;
        return li;
        }
    });

    videoListItems.append(...videoList);
}

const displayVideo = ({items: [video]}) => {
    const videoElement = document.querySelector('.video');

    videoElement.innerHTML = `
        <div class="container">
            <div class="video__player">
                <iframe class="video__iframe" src="https://youtube.com/embed/${video.id}" frameborder="0"
                    allowfullscreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share">
                </iframe>
            </div>
            <div class="video__container">
                <div class="video__content">
                    <h2 class="video-list__title">${video.snippet.title}</h2>
                    <p class="video-card__channel">${video.snippet.channelTitle}</p>
                    <p class="video-card__info">
                        <span class="video-card__views">${parseInt(video.statistics.viewCount).toLocaleString()} просмотр</span>
                        <span class="video-card__date">Дата премьеры: ${formatDate(video.snippet.publishedAt)}</span>
                    </p>
                    <p class="video-card__description">${video.snippet.description}</p>
                </div>
                <button href="/favourite.html" class="video__link favorite ${
                    favouriteIds.includes(video.id) ? 'active' : ''
                }" data-video-id="${video.id}">
                    <span class="video__favorite">В избранном</span>
                    <span class="video__no-favorite">В избранное</span>
                    <svg class="video__icon video__favorite">
                        <use xlink:href="/image/sprite.svg#star"/>
                    </svg>
                    <svg class="video__icon video__no-favorite">
                        <use xlink:href="/image/sprite.svg#star-ob"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

const formatDate = (str) => {
    const date = new Date(str);
    const formatter = new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    return formatter.format(date);
}


const getCorrectDurationTime = (duration) => {
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    duration = duration.replace('PT','');

    if (duration.indexOf('H') > -1) {
        let hours_split = duration.split('H');
        hours = parseInt(hours_split[0]);
        duration  = hours_split[1];
    }

    if (duration.indexOf('M') > -1) {
        let minutes_split = duration.split('M');
        minutes = parseInt(minutes_split[0]);
        duration = minutes_split[1];
    }

    if (duration.indexOf('S') > -1) {
        let seconds_split = duration.split('S');
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

// Реализация автора

const convertDuration = (isoDuration) => {
    const result = isoDuration
        .slice(2)
        .replace("H", " ч ")
        .replace("M", " мин ")
        .replace("S", " сек");
    return result;
}

const init = () => {
    const urlSearchParams = new URLSearchParams(location.search);
    const videoId = urlSearchParams.get('id');
    const searchQuery = urlSearchParams.get('q');

    if (currentPage === "index.html" || currentPage === '') {
        fetchTrendingVideos(12).then(displayVideoList);
    } else if (currentPage === "video.html" && videoId) {
        fetchChosenVideo(videoId).then(displayVideo);
        fetchTrendingVideos(6).then(displayVideoList);
    } else if (currentPage === "favourite.html") {
        fetchFavouriteVideos(6).then(displayVideoList);
    } else if (currentPage === "search.html" && searchQuery) {
        console.log(currentPage);
    }

    document.body.addEventListener('click', ({target}) => {
        const itemFavourite = target.closest('.favorite');

        if (itemFavourite) {
            const videoId = itemFavourite.dataset.videoId;

            if (favouriteIds.includes(videoId)) {
                favouriteIds.splice(favouriteIds.indexOf(videoId), 1);
                localStorage.setItem('favouriteVideos', JSON.stringify(favouriteIds));
                itemFavourite.classList.remove('active');
            } else {
                favouriteIds.push(videoId);
                localStorage.setItem('favouriteVideos', JSON.stringify(favouriteIds));
                itemFavourite.classList.add('active');
            }
        }
    });
}

init();
