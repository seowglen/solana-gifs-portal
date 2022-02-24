import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';

import idl from './idl.json';
import kp from './keypair.json';

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const TEST_GIFS = [
	'https://media.giphy.com/media/otnqsqqzmsw7K/giphy.gif',
	'https://media.giphy.com/media/GbMEqTy3M5NMA/giphy.gif',
	'https://media.giphy.com/media/2IodXMfbcVVrW/giphy.gif',
	'https://media.giphy.com/media/1d7F9xyq6j7C1ojbC5/giphy.gif'
]

const App = () => {

  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);
  const [hoveredGifIndex, setHoveredGifIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
  
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    setInputValue('');
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
  
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue)
  
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  let modal = document.getElementById("myModal");

  const renderModal = () => {
    modal.style.display = "block";
  }

  const renderCloseModalOnClick = () => {
    modal.style.display = "none";
  }

  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
    if (event.target === document.getElementsByClassName("modal-image-left")[0]) {
      modal.style.display = "none";
    }
    if (event.target === document.getElementsByClassName("modal-image-right")[0]) {
      modal.style.display = "none";
    }
  }

  const handleLeftClick = (index) => {
    setHoveredGifIndex(index - 1);
  }

  const handleRightClick = (index) => {
    setHoveredGifIndex(index + 1);
  }

  function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }
  
  function formatDate(date) {
    return (
      [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
      ].join('-') +
      ' ' +
      [
        padTo2Digits(date.getHours()),
        padTo2Digits(date.getMinutes()),
        padTo2Digits(date.getSeconds()),
      ].join(':')
    );
  }

  const renderNotConnectedContainer = () => (
    <div className="disconnected-container">
      <button
        className="cta-button connect-wallet-button"
        onClick={connectWallet}
      >
        Connect to Wallet
      </button>
    </div>
  );

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } else {
      return (
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Submit a GIF link to the portal!"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">Submit</button>
          </form>
          <div className="gif-grid">
            {gifList.map((item, index) => (
              <div 
                className="gif-item" 
                key={index} 
                onClick={() => renderModal()} 
                onMouseEnter={() => setHoveredGifIndex(index)}
              >
                <img src={item.gifLink} alt={item.gifLink} />
                <div className="gif-description">
                  <div className="text">🤍 0</div>
                  <div className="text">💬 0</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();
  
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const getGifList = async() => {
    setLoading(true);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Got the account", account)
      setGifList(account.gifList.reverse())
      setLoading(false);
    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
      setLoading(false);
    }
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        {gifList.length > 0 &&
          <div id="myModal" className="modal">
            <div className="modal-divs">
              <div className="modal-image-left">
                <div className="left-button-background">
                  {hoveredGifIndex > 0 && 
                    <span className="left-button" onClick={() => handleLeftClick(hoveredGifIndex)}>&lt;</span>
                  }
                </div>
              </div>
              <div className="modal-content-container">            
                <div className="modal-content">
                  <span className="close" onClick={() => renderCloseModalOnClick()}>&times;</span>
                  <div className="modal-items">
                    <div className="modal-image-container">
                      <img 
                        className="modal-image" 
                        src={gifList[hoveredGifIndex].gifLink} 
                        alt={gifList[hoveredGifIndex].gifLink}
                      ></img>
                    </div>
                    <div className="modal-actions-container">
                      <div className="title-container">
                        <div className="title">GIF by: <strong>{
                          gifList[hoveredGifIndex].userAddress.toString().slice(0, 4) 
                          + '...' 
                          + gifList[hoveredGifIndex].userAddress.toString().slice(gifList[hoveredGifIndex].userAddress.toString().length - 4,)
                        }</strong> ({formatDate(new Date())})</div>
                      </div>
                      <div className="comments-container">
                        <div className="single-comment-container">
                          <div className="single-comment">
                            <div className="single-comment-wallet-addr">{
                              gifList[hoveredGifIndex].userAddress.toString().slice(0, 4) 
                              + '...' 
                              + gifList[hoveredGifIndex].userAddress.toString().slice(gifList[hoveredGifIndex].userAddress.toString().length - 4,)
                            }</div>
                            {": hello!!! test test test test test test \n\ntest test test test test test test test test test \ntest test test test test  test test test test"} 
                          </div>
                          <div className="comment-timestamp">
                            {formatDate(new Date())}
                          </div>
                        </div>
                        <div className="single-comment-container">
                          <div className="single-comment">
                            <div className="single-comment-wallet-addr">{
                              gifList[hoveredGifIndex].userAddress.toString().slice(0, 4) 
                              + '...' 
                              + gifList[hoveredGifIndex].userAddress.toString().slice(gifList[hoveredGifIndex].userAddress.toString().length - 4,)
                            }</div>
                            : hello how are you i am good thanks
                          </div>
                          <div className="comment-timestamp">
                            {formatDate(new Date())}
                          </div>
                        </div>
                        {/* START OF OVERFLOW TESTING */}
                        <div className="single-comment-container">
                          <div className="single-comment">
                            <div className="single-comment-wallet-addr">{
                              gifList[hoveredGifIndex].userAddress.toString().slice(0, 4) 
                              + '...' 
                              + gifList[hoveredGifIndex].userAddress.toString().slice(gifList[hoveredGifIndex].userAddress.toString().length - 4,)
                            }</div>
                            {": hello!!! test test test test test test \n\ntest test test test test test test test test test \ntest test test test test  test test test test"} 
                          </div>
                          <div className="comment-timestamp">
                            {formatDate(new Date())}
                          </div>
                        </div>
                        <div className="single-comment-container">
                          <div className="single-comment">
                            <div className="single-comment-wallet-addr">{
                              gifList[hoveredGifIndex].userAddress.toString().slice(0, 4) 
                              + '...' 
                              + gifList[hoveredGifIndex].userAddress.toString().slice(gifList[hoveredGifIndex].userAddress.toString().length - 4,)
                            }</div>
                            {": hello!!! test test test test test test \n\ntest test test test test test test test test test \ntest test test test test  test test test test"} 
                          </div>
                          <div className="comment-timestamp">
                            {formatDate(new Date())}
                          </div>
                        </div>
                        <div className="single-comment-container">
                          <div className="single-comment">
                            <div className="single-comment-wallet-addr">{
                              gifList[hoveredGifIndex].userAddress.toString().slice(0, 4) 
                              + '...' 
                              + gifList[hoveredGifIndex].userAddress.toString().slice(gifList[hoveredGifIndex].userAddress.toString().length - 4,)
                            }</div>
                            {": hello!!! test test test test test test \n\ntest test test test test test test test test test \ntest test test test test  test test test test"} 
                          </div>
                          <div className="comment-timestamp">
                            {formatDate(new Date())}
                          </div>
                        </div>
                        <div className="single-comment-container">
                          <div className="single-comment">
                            <div className="single-comment-wallet-addr">{
                              gifList[hoveredGifIndex].userAddress.toString().slice(0, 4) 
                              + '...' 
                              + gifList[hoveredGifIndex].userAddress.toString().slice(gifList[hoveredGifIndex].userAddress.toString().length - 4,)
                            }</div>
                            {": hello!!! test test test test test test \n\ntest test test test test test test test test test \ntest test test test test  test test test test"} 
                          </div>
                          <div className="comment-timestamp">
                            {formatDate(new Date())}
                          </div>
                        </div>
                        <div className="single-comment-container">
                          <div className="single-comment">
                            <div className="single-comment-wallet-addr">{
                              gifList[hoveredGifIndex].userAddress.toString().slice(0, 4) 
                              + '...' 
                              + gifList[hoveredGifIndex].userAddress.toString().slice(gifList[hoveredGifIndex].userAddress.toString().length - 4,)
                            }</div>
                            {": hello!!! test test test test test test \n\ntest test test test test test test test test test \ntest test test test test  test test test test"} 
                          </div>
                          <div className="comment-timestamp">
                            {formatDate(new Date())}
                          </div>
                        </div>
                        <div className="single-comment-container">
                          <div className="single-comment">
                            <div className="single-comment-wallet-addr">{
                              gifList[hoveredGifIndex].userAddress.toString().slice(0, 4) 
                              + '...' 
                              + gifList[hoveredGifIndex].userAddress.toString().slice(gifList[hoveredGifIndex].userAddress.toString().length - 4,)
                            }</div>
                            {": hello!!! test test test test test test \n\ntest test test test test test test test test test \ntest test test test test  test test test test"} 
                          </div>
                          <div className="comment-timestamp">
                            {formatDate(new Date())}
                          </div>
                        </div>
                        {/* END OF OVERFLOW TESTING */}
                      </div>
                      <div className="operations-container">
                        <div className="like-and-tips-container">
                          <div className="like-and-tips-operations">
                            <div className="like-and-comment-container">
                              <div className="like-container">
                                <div className="like">🤍</div>
                              </div>
                              <div className="comment-container" onClick={
                                () => document.getElementsByClassName("textarea")[0].focus()
                              }>
                                <div className="comment">💬</div>
                              </div>
                            </div>
                            <div className="tip-container">
                              <div className="tip">👑</div>
                            </div>
                          </div>
                          <div className="like-and-tips-number">
                            0 likes
                          </div>
                        </div>
                        <div className='create-comment-container'>
                          <textarea 
                            className="textarea"
                            placeholder="Add a comment..."
                          >
                          </textarea>
                          <div className="post-button-container">
                            <div className="post-button">
                              Post
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-image-right">
                <div className="right-button-background">
                  {hoveredGifIndex < gifList.length - 1 && 
                    <span className="right-button" onClick={() => handleRightClick(hoveredGifIndex)}>&gt;</span>
                  }
                </div>
              </div>
            </div>
          </div>
        }
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View the collection of all the funniest GIFs in the metaverse ✨
          </p>
        </div>
        {!walletAddress && renderNotConnectedContainer()}
        {walletAddress && gifList && renderConnectedContainer()}
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
