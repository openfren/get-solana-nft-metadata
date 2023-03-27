import { decodeMetadata } from './utils'
import { PublicKey } from '@solana/web3.js'
import 'isomorphic-fetch';
import fs from 'fs';

let metadata_folder = 'metadata'
let airweave_metadata_folder = 'airweave_metadata'
let nft_json_file = 'foundingfrens_mint_addresses.json'

const METADATA_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

const get_metadataPda = async (address:PublicKey) => {
	let [pda, bump] = await PublicKey.findProgramAddress([
		Buffer.from("metadata"),
		METADATA_PUBKEY.toBuffer(),
		address.toBuffer(),
	], METADATA_PUBKEY)
	return pda
}

async function getTokenMetadata(token_address:string) {
	try {
		const token_publickey = new PublicKey(token_address)
		const metadata_pda = await get_metadataPda(token_publickey);

		const data = {
			"jsonrpc": "2.0",
			"id": 1,
			"method": "getAccountInfo",
			"params": [
				metadata_pda.toBase58(),
				{
					"encoding": "base64"
				}
			]
		}

		const metadata_res = await fetch("https://api.mainnet-beta.solana.com", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data),
		}); 
		const metadata_parsed = await metadata_res.json();
		const metadata_buf = Buffer.from(metadata_parsed.result.value.data[0], 'base64');
		const metadata = decodeMetadata(metadata_buf)
		console.log(metadata)

		const arweave_res = await fetch(metadata.data.uri)
		const arweave= await arweave_res.json()
		console.log("Arweave ",arweave)

		const metadataFileName = `${metadata.data.name}-${metadata.mint}.json`;
		fs.writeFileSync(metadata_folder + '/' + metadataFileName, JSON.stringify(metadata));
		console.log(`Metadata saved to ${metadataFileName}`);

        const arweaveFileName = `${metadata.data.name}-${metadata.mint}.json`;
        fs.writeFileSync(airweave_metadata_folder + '/' + arweaveFileName, JSON.stringify(arweave));
        console.log(`Arweave saved to ${arweaveFileName}`);

		return { metadata ,arweave} 

	} catch (e) {
		console.log(e)
	}
}


let nfts = JSON.parse(fs.readFileSync(nft_json_file, 'utf8'));

console.log(nfts)

//  Loop through the nfts and save the metadata

const save_metadata = async () => {
    for (const nft of nfts) {
        console.log(nft)
        const metadata = await getTokenMetadata(nft)
        // wait 4 seconds before fetching the next nft
        await new Promise(r => setTimeout(r, 4000));
    }
}

save_metadata()

