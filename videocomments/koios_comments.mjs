import { } from "../forum/3box.js"; 
import { getUserAddress, getWeb3,authorize } from "../forum/koios_web3.mjs";
import {DomList,getElement,FitOneLine} from '../lib/koiosf_util.mjs';
import {log} from '../lib/koiosf_log.mjs'; 

let box;
let space;
let currentThread;
let index = 0;
var GlobalCommentList = new DomList("commententry");
const Moderator="0xe88cAc4e10C4D316E0d52B82dd54f26ade3f0Bb2";
const KoiosSpace = "koiostestspace2";
var dummyvideos = new Array("1.1 Testvideo", "1.2 Testvideo2", "1.3 Testvideo3");

window.onerror = async function(message, source, lineno, colno, error) {   // especially for ios
    console.log("In onerror");
    var str=`Error: ${message} ${source}, ${lineno}, ${colno}  `;
    if (error && error.stack) str = str.concat('\n').concat(error.stack);
    log(str);    
} 

window.addEventListener('DOMContentLoaded', asyncloaded);

async function asyncloaded() {
    await authorize()
    box = await Box.openBox(getUserAddress(), getWeb3().givenProvider);    
    await box.syncDone
    space = await box.openSpace(KoiosSpace);
    
    SetVideoTitle(getElement("titletext"), index);
    getElement("posttext").addEventListener('animatedclick',PostComment)
    getElement("nextvideo").addEventListener('animatedclick',NextVideo)
    getElement("lastvideo").addEventListener('animatedclick',LastVideo)
    var target=getElement("commenttext")    
    target.contentEditable="true"; // make div editable
    target.style.whiteSpace ="pre";  
}

async function SetVideoTitle(target, index) {
    target.innerHTML = dummyvideos[index];
    WriteThread(target.innerHTML);
    console.log(currentThread);
}

async function NextVideo() {
    index = index +  1;
    console.log(index);
    if (index > dummyvideos.length) index = dummyvideos.length;
    SetVideoTitle(getElement("titletext"), index);
}

async function LastVideo() {
    index = index - 1;
    console.log(index);
    if (index < 0) index = 0;
    SetVideoTitle(getElement("titletext"), index);
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
            var date = new Date(posts[i].timestamp * 1000);
            console.log(`${i} ${posts[i].message} ${did} ${date.toString() }`)
            
            var target = GlobalCommentList.AddListItem() // make new entry
            target.getElementsByClassName("commentmessagetext")[0].innerHTML = posts[i].message            
            FitOneLine(target.getElementsByClassName("commentmessagetext")[0])
            target.getElementsByClassName("commenttimetext")[0].innerHTML = date
            FitOneLine(target.getElementsByClassName("commenttimetext")[0])
            
            target.id = posts[i].postId                                        // remember which postId's we've shown
            FindSender (target.getElementsByClassName("commentsendertext")[0],did);  // show then profilename (asynchronous)  
            FitOneLine(target.getElementsByClassName("commentsendertext")[0])
            var deletebutton=target.getElementsByClassName("commentdelete")[0]
            SetDeleteButton(deletebutton,posts[i].postId)            
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
          UpdatePosts();
        } catch (error) {
          console.log(error);
        }
    }
}

async function FindSender (target,did) {
    var profile = await Box.getProfile(did);
    target.innerHTML = profile.name ? profile.name : did           
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