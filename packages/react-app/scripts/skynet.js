const skynetNode = require("@skynetlabs/skynet-nodejs");
const skynet = require("skynet-js");

const chalk = require("chalk");
const { clearLine } = require("readline");

// URL of Skynet Portal you wish to use
const portal = "https://siasky.net";

// Create clients for upload and resolver skylink.
const client = new skynet.SkynetClient(portal);
const nodeClient = new skynetNode.SkynetClient(portal);

// Set seed for generating and updating resolver skylink. If blank, resolver skylink will not be updated.
const resolverSeed = "";
// Set dataKey for resolver skylink.
const resolverDataKey = "buildDeployment";

const pushDirectoryToSkynet = async path => {
  try {
    const response = await nodeClient.uploadDirectory(path);
    return response;
  } catch (e) {
    return {};
  }
};

const publishSkylinkToResolverSkylink = async skylink => {
  try {
    // Setup Keys for Read/Write of Mutable Data
    const { privateKey, publicKey } = skynet.genKeyPairFromSeed(resolverSeed);
    const dataKey = resolverDataKey;

    // Set Registry Entry to point at our Skylink
    await client.db.setDataLink(privateKey, dataKey, skylink);

    // Get the resolver skylink that represents the registry entry
    const resolverSkylink = await client.registry.getEntryLink(publicKey, dataKey);

    return resolverSkylink;
  } catch (e) {
    return {};
  }
};

const deploy = async () => {
  console.log("🛰  Sending to Skynet...");
  const skylink = await pushDirectoryToSkynet("./build");
  let resolverSkylinkUrl = "";

  if (!skylink) {
    console.log(`📡 App deployment failed`);
    return false;
  }

  // Get URL based off preferred portal
  const skylinkUrl = await client.getSkylinkUrl(skylink, { subdomain: true });

  console.log(`📡 App deployed to Skynet with skylink: ${chalk.cyan(skylink)}`);

  console.log();

  if (resolverSeed) {
    // call method up update resolver skylink
    const resolverSkylink = await publishSkylinkToResolverSkylink(skylink);

    // Get URL based off preferred portal
    resolverSkylinkUrl = await client.getSkylinkUrl(resolverSkylink, { subdomain: true });

    console.log(`📡 Resolver skylink updated: ${chalk.cyan(resolverSkylink)}`);
  }

  console.log("🚀 Deployment to Skynet complete!");
  console.log();

  console.log(`Use the link${resolverSkylinkUrl && "s"} below to access your app:`);
  console.log(`   Immutable Skylink Url: ${chalk.cyan(`${skylinkUrl}`)}`);
  if (resolverSkylinkUrl) {
    console.log(`   Resolver Skylink Url: ${chalk.cyan(`${resolverSkylinkUrl}`)}`);
    console.log();
    console.log(
      'Each new deployment will have a unique skylink while the "resolver skylink" will always point at the most recent deployment.',
    );
    console.log(
      "It is recommended that you share the resolver skylink url so that people always see the newest version of your app.",
    );
    console.log(
      "You can use the resolver skylink (starting with `sia://`) for setting ENS content hashes for a decentralized domain.",
    );
  }
  console.log();
  return true;
};

deploy();
