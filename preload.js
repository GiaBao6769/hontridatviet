let templateRoot = null;

export const API_BASE =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://my-backend.onrender.com";


export async function preloadTemplates() {
    if (templateRoot) return templateRoot;

    const res = await fetch("templates.html");
    const html = await res.text();

    const div = document.createElement("div");
    div.innerHTML = html;

    templateRoot = div;
    return templateRoot;
}


// let artObj = {
//     "title": "",
//     "desc": "",
//     "author": "",
//     "date": "",
//     "thumbnail": "",
//     "state": ""
//     "tags": []
//     
// };

async function createAObj(path){
    let PATH = "journals\\" + path + "\\journal.md"; 
    const res = await fetch(PATH);
    const data = await res.text();
    const lines = data.split("\n");

    let title = null, date = null, desc = null, thumbnail = null, hashtags = null;

    for (const line of lines) {
        if (line.startsWith("[title]")) {
            title = line.slice(7);
        }
        else if (line.startsWith("[date]")) {
            date = line.slice(6);
        }
        else if (line.startsWith("[desc]")) {
            desc = line.slice(6);
        }
        else if (line.startsWith("[img]") && thumbnail == null) {
            let keys = line.split(":");
            thumbnail = `${path}/images/${keys[0].slice(6)}`;
        }
        else if (line.startsWith("[hashtags]")) {
            let keys = line.split(" ");
            hashtags = keys.slice(1);
            if (hashtags.length){
                hashtags[hashtags.length - 1] = hashtags[hashtags.length - 1].replace(/\r$/, "");
            }
        }
    }

    if (thumbnail === null){
        thumbnail = "../images/no_thumbnail.png";
    }

    return new Object({
        "title":title,
        "desc": desc,
        "date": date,
        "thumbnail": thumbnail,
        "hashtags": hashtags,
        "path": path
    });
}


async function getArtObjs(path){
    const res = await fetch(path);
    const data = await res.json();
    const jObjs = Object.values(data.journalList);
    let artObjs = [];
    for (let jO of jObjs){
        if (jO.state==="private") continue;
        let Oj = await createAObj(jO.path);
        artObjs.push(Oj);
    }
    return artObjs
}

export const artObjs = await getArtObjs("journal_list.json");

export const suggestArtObjs = await getArtObjs("suggest_list.json");

// remember to remove /r next time



async function addJournalCard(target, journal){
    let root = await preloadTemplates();

    const template = root.querySelector("#ARTICLECARD-TEMP");

    if (!template) {
        console.error("Template not found:", "articleCard");
        return;
    }
    let clone = template.content.cloneNode(true);
    clone.querySelector(".articleCardLink").href = `articleTemplate.html?journal=journals/${journal.path}`;
    clone.querySelector(".articleCardImg").src = `journals/${journal.thumbnail}`;
    clone.querySelector(".articleCardTitle").textContent = journal.title;
    clone.querySelector(".articleCardDesc").textContent = journal.desc;
    if (journal.hashtags !== null){
        for (let tag of journal.hashtags){
            const a = document.createElement("a");
            a.classList.add("hashtag");
            a.textContent = tag;
            a.href=`search.html?hashtag=${tag}`;
            clone.querySelector(".articleCardHashtags").appendChild(a);
        }
    }


    document.getElementById(target).appendChild(clone);
}

export async function generateArticleCards(sectionId, artObjs){
    try{
        artObjs.forEach(aO => {
            addJournalCard(sectionId, aO);
        })
    }
    catch (err){
        console.error(err);
    }
}

//remember to allow space between line in md