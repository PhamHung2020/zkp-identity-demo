# ZKP Identity Demo Project

This project is inspired by Iden3 project.

## Introduction

This project demonstrates the basic working mechanism of an Identity Management system that utilizes Zero-knowledge Proof (ZKP). By using ZKP, a user can prove to a party that the user has some information which satisfies specific requirements of the party, without revealing that information.

The system has 3 actors:
- **Identity**: a profile that identifies a user in the system. An Identity is managed by a public-private key pair. An Identity can have multiple pieces of information (name, birthday, residence, etc.), each is called a **Claim**.
- **Issuer**: a trusted authority where a user can register his/her information. Imagine it's like a goverment's office where people register their personal information and receive their residence cards with a unique number. The Issuer store information of all users securely.
- **Verifier**: a party that challenges users to pass its requirements. For example, a Verifier can be a cinema that only allow people above 18 years old to watch 18+ movies.

## Technology

The Issuer stores all Identities info by using *Merkle Tree*. Each Identity corresponds to a *Identity Merkle Tree* (or *Identity Tree*). Each leaf of the tree holds a piece of information, or *Claim*, in the Identity. Hash of the root node of the tree is called the *State* of the Identity. From all Identity Trees, the Issuer builds a *Global Merkle Tree* (or *Global Tree*) whose leaves are states of Identities.

An Identity is managed by a public-private key pair which follows the Baby JubJub Eliptic curve. The public key is the first Claim of the Identity and is registered to Issuer. Others Claims like name, birthday, etc. can be added to Identity later.

The objective of the project is using ZKP to help a user, or an Identity, to prove to a Verifier that the Identity possesses information that satisfies the Verifier's requirements. The requirements are represented as one or more *circuits*. From these circuits, an Identity uses its Claims to generate cryptographically proofs and send them to the Verifier. The Verifier can verify to check if the proofs are valid (may require additional infomation from the Issuer). By doing so, the Identity can prove to the Verifier without revealing its information.

The project is implemented by using following technologies:
- Issuer: an API server for registering Identities' Claims, using Javascript + Express + Iden3 (for merkle tree). Currently, all information are stored in memory. Therefore, if the server is shutdown, all info is lost.
- Identity Manager: a Vue3 project that manages Identities for users. It also uses Iden3 for merkle tree and snarkJS to generate ZKP. Identities' info are stored in local storage.
- Verifier: Javscript + Express for server, simple HTML for frontend, snarkJS for verifying ZKP.

## Basic Workflow

#### Register Identity and Claim

1. Identity generate its key pair and send the public key to the Issuer (through) to register a new Identity.
2. The Issuer check if public key already exists, build a (empty) new Merkle tree, add the public key as the first Claim of this new Identity. Then, the Issuer derives the *Genesis ID* from the public key and send it back to the Identity, which means the new Identity is registered successfully. The Issuer update the Global Tree.
3. The Identity receives the ID from the Issuer, it also builds a merkle tree for itself with the same procedure. This allows the Identity to keep track of its information without relying on the Issuer.
4. The Identity call the Issuer's API to add a new Claim.
5. The Issuer, after validation, update the merkle tree corresponding to the requested Identity, and update the Global Tree.
6. The Identity also does the same procedure (except updating the Global Tree).

#### Generate and Verify ZKP

1. The Verifer publics their circuits and additional files which are necessary for the Identity to generate proofs.
2. The Identity downloads those files from a public URL provided by the Verifier, then uses its Claims to generate ZKPs.
3. The Identity submits generated ZKPs to the Verifier.
4. The Verifier verifies to check if submitted proofs are valid.

## How to Run

#### Requirements

- NodeJS v20+.
- NPM.

#### Set up

Download dependencies of the project. From the root of the project, run following commands:
```cmd
npm i
cd identity_manager
npm i
```

#### Issuer

From the root of the project,

```cmd
cd issuer
node server.js
```

The Issuer server runs on port 3000.

#### Identity Manager

From the root of the project,

```cmd
cd identity_manager
npm run dev
```

The Identity Manager project runs on port 5173.

#### Verifier

```cmd
cd verifier
```

- Backend:

```cmd
cd backend
node server.js
```

The server of Verifier runs on port 5000.

- Fronted: it is a simple HTML file, so just open it using your browser.