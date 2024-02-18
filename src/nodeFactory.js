const { createNodeFactory } = require("gatsby-node-helpers").default;
const { createRemoteFileNode } = require(`gatsby-source-filesystem`);

const PLACE_TYPE = `Place`;
const REVIEW_TYPE = `Review`;

const { createNodeHelpers } = require("gatsby-node-helpers")({
  typePrefix: `GooglePlaces`,
});

const { generateNodeId } = createNodeHelpers;

const placeNode = createNodeFactory(PLACE_TYPE, (node) => {
  // Process place node (e.g., link children reviews)
  if (node.reviews) {
    node.children = node.reviews.map((review) =>
      generateNodeId(REVIEW_TYPE, review.time.toString())
    );
  }
  return node;
});

const reviewNode = (
  node,
  { createNode, createNodeId, store, cache, reporter }
) => {
  // This is a custom function, not directly using `createNodeFactory` because we need to perform async operations
  return (async () => {
    if (node.profile_photo_url) {
      try {
        // Download the profile photo and create a File node
        const fileNode = await createRemoteFileNode({
          url: node.profile_photo_url,
          parentNodeId: node.id,
          createNode, // passed from gatsby's actions
          createNodeId,
          cache,
          store,
          reporter,
        });

        // If the file was created successfully, link it to the review node
        if (fileNode) {
          node.localProfilePhoto___NODE = fileNode.id; // This links the File node to the Review node
        }
      } catch (error) {
        reporter.warn(
          `Error downloading image: ${node.profile_photo_url}`,
          error
        );
      }
    }

    // Finally, return the modified node
    return node;
  })();
};

module.exports = {
  placeNode,
  reviewNode: createNodeFactory(REVIEW_TYPE, reviewNode), // Wrap `reviewNode` with `createNodeFactory` to ensure it's processed correctly
};
