import { } from "../lib/3box.js"; // from "https://unpkg.com/3box/dist/3box.js"; // prevent rate errors

import { getUserAddress, getWeb3Provider,authorize } from "./koiosf_login.mjs";
import {DomList,getElement,FitOneLine,LinkVisible,subscribe,GetImageIPFS} from '../lib/koiosf_util.mjs';
import {log} from '../lib/koiosf_log.mjs'; 

let box;
let space;
let currentThread;
var GlobalCommentList = new DomList("commententry");
const Moderator="0xe88cAc4e10C4D316E0d52B82dd54f26ade3f0Bb2";
const KoiosSpace = "koiostestspace2";

window.onerror = async function(message, source, lineno, colno, error) {   // especially for ios
    console.log("In onerror");
    var str=`Error: ${message} ${source}, ${lineno}, ${colno}  `;
    if (error && error.stack) str = str.concat('\n').concat(error.stack);
    log(str);    
} 

window.addEventListener('DOMContentLoaded', asyncloaded);

async function ScrCommentMadeVisible() {
    console.log("In ScrCommentMadeVisible");
    
    await authorize()
    
    await init3boxpromise;
    
    
    var titletext="test thread"
    
    if (space) { // else no connection to 3box
        WriteThread(titletext);
        getElement("titletext").innerHTML=titletext   
        getElement("posttext").addEventListener('animatedclick',PostComment)    
        var target=getElement("commenttext")    
        target.contentEditable="true"; // make div editable
        target.style.whiteSpace ="pre";  
    }
}    

subscribe("web3providerfound",NextStep)

var init3boxpromise;

async function NextStep() {
    init3boxpromise=Init3box();    
}   

async function Init3box() {
    console.log("Init3box");
    var ga=getUserAddress()
    var pr=getWeb3Provider()
    console.log(ga)
    console.log(pr);
    console.log("Start openbox")
    box = await Box.openBox(ga,pr);    
    console.log("after openbox");
    await box.syncDone
    console.log("after syncdone");
    space = await box.openSpace(KoiosSpace);
    console.log("after openspace");
}


async function asyncloaded() {  
    LinkVisible("scr_comment" ,ScrCommentMadeVisible)   
}

async function WriteThread(threadName) {
    GlobalCommentList.EmptyList();
    currentThread = await space.joinThread(threadName, {
        firstModerator: Moderator
    });

    currentThread.onUpdate(async () => {
        var uposts = await currentThread.getPosts()
        await ShowPosts(uposts);
    })
    currentThread.onNewCapabilities((event, did) => console.log(did, event, ' the chat'))
    const posts = await currentThread.getPosts()
    console.log("posts: ", posts);
    await ShowPosts(posts);
}

/*
 * Show the posts in the interface
 */
async function ShowPosts(posts) {
    for (var i=0;i<posts.length;i++) {        
        if (!document.getElementById(posts[i].postId) ){ // check if post is already shown
            console.log(posts[i]);
            var did=posts[i].author;           
            posttime = SetTime(posts[i].timestamp * 1000);
            console.log(`${i} ${posts[i].message} ${did} ${posttime.toString() }`)
            
            var target = GlobalCommentList.AddListItem() // make new entry
            target.getElementsByClassName("commentmessagetext")[0].innerHTML = posts[i].message            
            
            target.getElementsByClassName("commenttimetext")[0].innerHTML = posttime
            
            target.id = posts[i].postId                                        // remember which postId's we've shown
            FindSender (target.getElementsByClassName("commentsendertext")[0],did,target.getElementsByClassName("userphoto")[0]);  // show then profilename (asynchronous)  
            FitOneLine(target.getElementsByClassName("commentsendertext")[0])
            var deletebutton=target.getElementsByClassName("commentdelete")[0]
            SetDeleteButton(deletebutton,posts[i].postId)
            var votecounter=target.getElementsByClassName("commentupvotecounter")[0]    
            votecounter.innerHTML = await space.public.get(posts[i].postId)
            if (votecounter.innerHTML === 'undefined') {
                await space.public.set(posts[i].postId, 0)
                votecounter.innerHTML = 0
            }  
            var upvotebutton=target.getElementsByClassName("commentupvote")[0]
            SetUpVoteButton(upvotebutton,posts[i].postId,votecounter.innerHTML);
            var downvotebutton=target.getElementsByClassName("commentdownvote")[0]
            SetDownVoteButton(downvotebutton,posts[i].postId,votecounter.innerHTML);
        }
    }
    
    var postdomids=document.getElementsByClassName("commententry");
    //console.log(postdomids);
    for (var i=0;i<postdomids.length;i++) {
        
        var checkpostid=postdomids[i].id;
        console.log(`checkpostid=${checkpostid}`);
        var found=false;
        for (var j=0;j<posts.length;j++) {
            if (posts[j].postId == checkpostid) { found=true;break; }
        }
        if (!found)
            postdomids[i].style.textDecoration="line-through";   
    }   
}

async function SetDeleteButton(domid,postid) { 
    domid.addEventListener('animatedclick',DeleteForumEntry)
    
    async function DeleteForumEntry() {
        console.log(currentThread);
        try {
          await currentThread.deletePost(postid);
        } catch (error) {
          console.log(error);
        }
    }
}

async function FindSender (target,did,profilepicture) {
    var profile = await Box.getProfile(did);
    target.innerHTML = profile.name ? profile.name : did
    if (profile.image) {
        var imagecid=profile.image[0].contentUrl
        imagecid=imagecid[`\/`]
        console.log(imagecid);
        profilepicture.src=await GetImageIPFS(imagecid)
    }           
}

async function PostComment() {
    var target=getElement("commenttext")    
    try {
        if (currentThread)
            await currentThread.post(target.innerHTML); 
      } catch (error) {
        console.log(error);
      }
}  

async function SetUpVoteButton(domid,postid,votecounter) { 
    domid.addEventListener('animatedclick',UpVoteMessage)
    console.log("before: ", votecounter)
    async function UpVoteMessage() {
        try {
            votecounter = parseInt(votecounter) + 1
            console.log("after: ", votecounter)
            await space.public.set(postid, votecounter)
        } catch (error) {
            console.log(error);
        }
    }
}

async function SetDownVoteButton(domid,postid,votecounter) { 
    domid.addEventListener('animatedclick',DownVoteMessage)
    console.log("before: ", votecounter)
    async function DownVoteMessage() {
        try {
            votecounter = parseInt(votecounter) - 1
            console.log("after: ", votecounter)
            await space.public.set(postid, votecounter)
        } catch (error) {
            console.log(error);
        }
    }
}

async function SetTime(timesettings) {
    var dateobject = new Date(timesettings);
    var hours = dateobject.getHours();
    var minutes = dateobject.getMinutes();
    var day = dateobject.getDay();
    var month = dateobject.getMonth();
    var timestamp = hours.concat(":", minutes, '\xa0', day,"/",month);

    return timestamp;
}