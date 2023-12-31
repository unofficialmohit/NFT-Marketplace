import { contractPromise } from './connectToContract.js';
import { web3js } from './connectToContract.js';
document.addEventListener('DOMContentLoaded', async () => {
    const nftContainer1 = document.getElementById("nft-container-1");
    const nftContainer2 = document.getElementById("nft-container-2");
    const nftCardTemplate = document.getElementById("nft-card-template");
    let contract; let account;
    var flag = 1;


    let ownerAddress;
    let currentAddress;
    function match() {
        ethereum.request({ method: 'eth_requestAccounts' }).then(function (accounts) {
            account = accounts[0];
            currentAddress = account;
        });
        contractPromise.then(function (contract) {
            contract.methods.getContractOwner().call()
                .then(function (result) {
                    ownerAddress = result;
                    const isContractOwner = currentAddress.toLowerCase() === ownerAddress.toLowerCase();

                    if (!isContractOwner) {
                        var overlay = document.getElementById("major");
                        overlay.remove();
                        setTimeout(function () {
                            window.alert("User Authentication Failure");
                            // history.back(); // change it
                            window.location = "index.html";
                        }, 500);
                    }



                })
                .catch(function (error) {
                    console.error('Error calling view function:', error);
                    alert("Error calling view function");
                });
        })
            .catch(function (error) {
                console.error('Error connecting to contract:', error);
                alert("Error Connecting to Contract");
            });
    }
    match();
    ethereum.on("accountsChanged", function (accounts) {
        // Refresh when account changes
        window.location.reload();
    });






    try {
        contract = await contractPromise;
        account;
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => {
            account = accounts[0];
            // console.log(account);
        });
        await contract.methods.getOwnedNotAuctionedTokens(account).call()
            .then(result => {
                // console.log('getOwnedNotAuctionedTokens ' + result);
                getMetaData(result, nftContainer1);
            })
            .catch(error => {
                console.error('Error calling view function:', error);
                alert("Error calling view function");

            });

        await contract.methods.getAuctionedNotEndedTokens(account).call()
            .then(result => {
                // console.log('getAuctionedNotEndedTokens ' + result);
                getMetaData(result, nftContainer2);
            })
            .catch(error => {
                console.error('Error calling view function:', error);
                alert("Error calling view function");

            });
    } catch (error) {
        console.error('Error connecting to contract:', error);
        alert("Error Connecting to Contract");
    }

    ethereum.on("accountsChanged", async function (accounts) {
        // Update button text when account changes
        account = accounts[0];
        await contract.methods.getOwnedNotAuctionedTokens(account).call()
            .then(result => {
                console.log('getOwnedNotAuctionedTokens ' + result);
                getMetaData(result, nftContainer1);
            })
            .catch(error => {
                console.error('Error calling view function:', error);
                alert("Error calling view function");

            });

        await contract.methods.getAuctionedNotEndedTokens(account).call()
            .then(result => {
                // console.log('getAuctionedNotEndedTokens ' + result);
                getMetaData(result, nftContainer2);
            })
            .catch(error => {
                console.error('Error calling view function:', error);
                alert("Error calling view function");

            });
    });

    function getMetaData(response, nftContainer) {
        response.forEach(item => {
            if (item[0] !== '' && item[1] !== '') {
                const tokenId = item[0];
                flag = 0;
                // console.log("item[0] --> " + item[0] + " item[1] --> " + item[1]);
                fetchMetadata(item[1]).then(nft => {
                    if (nft) {
                        // console.log(metadata);
                        // console.log(metadata.description);
                        const card = nftCardTemplate.content.cloneNode(true);

                        // Update the cloned elements with NFT details
                        const image = card.querySelector(".nft-image");
                        image.src = nft.image;
                        image.alt = nft.name;

                        const nftName = card.querySelector(".nft-name");
                        nftName.textContent = nft.name;

                        const viewDetailsButton = card.querySelector('.view-details-btn');
                        const myModal = new bootstrap.Modal('#nft-details-modal');
                        viewDetailsButton.addEventListener('click', () => {
                            const modalBody = document.querySelector(".modal-body");
                            const nftDetails = modalBody.querySelector(".nft-details");
                            nftDetails.querySelector('.nft-name').textContent = nft.name;
                            const nftDescription = nftDetails.querySelector(".nft-description");
                            nftDescription.querySelector(".tokenID").textContent = tokenId;

                            nftDescription.querySelector(".card-number").textContent = nft.description['Card Number'];
                            nftDescription.querySelector(".rarity").textContent = nft.description.Rarity;
                            nftDescription.querySelector(".card-type").textContent = nft.description['Card Type'];
                            nftDescription.querySelector(".hp").textContent = nft.description.HP;
                            nftDescription.querySelector(".stage").textContent = nft.description.Stage;
                            nftDescription.querySelector(".attack-1").textContent = nft.description['Attack 1'];
                            nftDescription.querySelector(".attack-2").textContent = nft.description['Attack 2'];
                            nftDescription.querySelector(".weakness").textContent = nft.description.Weakness;
                            nftDescription.querySelector(".retreat-cost").textContent = nft.description['Retreat Cost'];

                            myModal.show();

                            // event listener for modal close button
                            document.querySelector('.btn-close').addEventListener('click', () => {
                                myModal.hide();
                            });
                        });

                        const additionalDetails = card.querySelector(".additional-details");
                        const auctionBtn = additionalDetails.querySelector(".auction-button");
                        const listingPrice = additionalDetails.querySelector(".listing-price");
                        if (nftContainer === nftContainer1) {
                            auctionBtn.addEventListener('click', async () => {
                                if (listingPrice.value === "") {
                                    // Input is empty, display an error message or take appropriate action
                                    alert("Listing price cannot be empty.");
                                }
                                else if (listingPrice.value <= 0) {
                                    alert("Listing price should be more than 0.");

                                } else {
                                    // Input is not empty, proceed with further processing
                                    console.log("Listing price:", listingPrice.value);
                                    const weiValue = web3js.utils.toWei(listingPrice.value.toString(), 'ether');
                                    console.log(weiValue);
                                    await contract.methods.startAuction(tokenId, weiValue)
                                        .send({ from: account })
                                        .on('transactionHash', (hash) => {
                                            // Transaction submitted
                                            console.log('Transaction hash:', hash);
                                        })
                                        .on('confirmation', function (confirmationNumber, receipt) {
                                            console.log('Confirmation number:', confirmationNumber);
                                            console.log('Receipt:', receipt);
                                        })
                                        .on('error', (error) => {
                                            // Error occurred
                                            console.error('Error:', error);
                                            alert("Error Occured , Contact Owner");

                                        });
                                    window.location.reload();
                                }
                            });
                        }
                        else if (nftContainer === nftContainer2) {
                            const listingPriceLabel = additionalDetails.querySelector(".listing-price-label");
                            additionalDetails.querySelector(".column1").remove();
                            listingPriceLabel.remove();
                            auctionBtn.textContent = 'End Auction';
                            auctionBtn.classList.remove('ms-2');
                            auctionBtn.addEventListener('click', async () => {
                                await contract.methods.endAuction(tokenId)
                                    .send({ from: account })
                                    .on('transactionHash', function (hash) {
                                        console.log('Transaction hash:', hash);
                                    })
                                    .on('confirmation', function (confirmationNumber, receipt) {
                                        console.log('Confirmation number:', confirmationNumber);
                                        console.log('Receipt:', receipt);
                                    })
                                    .on('error', function (error) {
                                        console.error('Error:', error);
                                        alert("Error Occured , Contact Owner");
                                    });
                                window.location.reload();
                            });
                        }
                        // Append the card to the container
                        nftContainer.appendChild(card);
                    }
                });

            }
        });


        function convertIPFSURL(ipfsURL) {
            const ipfsGateway = "https://ipfs.io/ipfs/";
            const ipfsPrefix = "ipfs://";

            if (ipfsURL.startsWith(ipfsPrefix)) {
                const cid = ipfsURL.substring(ipfsPrefix.length);
                return ipfsGateway + cid;
            }

            return ipfsURL; // return unchanged if not starting with "ipfs://"
        }

        async function fetchMetadata(tokenURI) {
            const convertedURI = convertIPFSURL(tokenURI);
            try {
                const response = await fetch(convertedURI);
                const metadata = await response.json();

                if (metadata.image) {
                    metadata.image = convertIPFSURL(metadata.image);
                }

                return metadata;
            } catch (error) {
                console.error("Failed to fetch metadata:", error);
                alert("Failed to fetch metadata");
                return null;
            }
        }

    }
    if (flag == 1) {
        const separator1 = document.getElementById('startauction');
        const separator2 = document.getElementById('endauction');
        separator2.remove(); separator1.remove();
        const msgDiv = document.createElement('div');
        msgDiv.id = 'noNftMsg';
        msgDiv.textContent = 'No NFT Available to Start or End Auction';
        msgDiv.style.justifyContent="center";
        document.body.appendChild(msgDiv);
    }

});
