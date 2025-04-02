// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title LabelValidator
/// @notice Library for validating domain labels in the format adjective-descriptor-noun
library LabelValidator {
    // Compact word storage using bytes32
    struct WordList {
        bytes32[] wordHashes;
        uint256 wordCount;
    }

    error InvalidLabelFormat();
    error InvalidWord();

    /// @notice Initializes all word lists with predefined words
    /// @param adjectives The adjectives word list
    /// @param descriptors The descriptors word list
    /// @param nouns The nouns word list
    function initializeWordLists(WordList storage adjectives, WordList storage descriptors, WordList storage nouns)
        public
    {
        adjectives.wordHashes = new bytes32[](50);
        descriptors.wordHashes = new bytes32[](50);
        nouns.wordHashes = new bytes32[](50);

        // Add adjectives
        addWord("swift", adjectives);
        addWord("brave", adjectives);
        addWord("wise", adjectives);
        addWord("calm", adjectives);
        addWord("bold", adjectives);
        addWord("kind", adjectives);
        addWord("pure", adjectives);
        addWord("wild", adjectives);
        addWord("soft", adjectives);
        addWord("fierce", adjectives);
        addWord("bright", adjectives);
        addWord("dark", adjectives);
        addWord("warm", adjectives);
        addWord("cool", adjectives);
        addWord("fresh", adjectives);
        addWord("deep", adjectives);
        addWord("high", adjectives);
        addWord("low", adjectives);
        addWord("fast", adjectives);
        addWord("slow", adjectives);
        addWord("rich", adjectives);
        addWord("poor", adjectives);
        addWord("young", adjectives);
        addWord("old", adjectives);
        addWord("new", adjectives);
        addWord("rare", adjectives);
        addWord("fine", adjectives);
        addWord("true", adjectives);
        addWord("fair", adjectives);
        addWord("free", adjectives);
        addWord("safe", adjectives);
        addWord("sure", adjectives);
        addWord("real", adjectives);
        addWord("full", adjectives);
        addWord("open", adjectives);
        addWord("wide", adjectives);
        addWord("long", adjectives);
        addWord("short", adjectives);
        addWord("hard", adjectives);
        addWord("soft", adjectives);
        addWord("loud", adjectives);
        addWord("quiet", adjectives);
        addWord("sweet", adjectives);
        addWord("sour", adjectives);
        addWord("sharp", adjectives);
        addWord("dull", adjectives);
        addWord("smooth", adjectives);
        addWord("rough", adjectives);
        addWord("light", adjectives);
        addWord("heavy", adjectives);

        // Add descriptors
        addWord("mighty", descriptors);
        addWord("noble", descriptors);
        addWord("royal", descriptors);
        addWord("sacred", descriptors);
        addWord("divine", descriptors);
        addWord("eternal", descriptors);
        addWord("cosmic", descriptors);
        addWord("stellar", descriptors);
        addWord("lunar", descriptors);
        addWord("solar", descriptors);
        addWord("oceanic", descriptors);
        addWord("mountain", descriptors);
        addWord("forest", descriptors);
        addWord("desert", descriptors);
        addWord("river", descriptors);
        addWord("valley", descriptors);
        addWord("crystal", descriptors);
        addWord("golden", descriptors);
        addWord("silver", descriptors);
        addWord("bronze", descriptors);
        addWord("ancient", descriptors);
        addWord("modern", descriptors);
        addWord("future", descriptors);
        addWord("past", descriptors);
        addWord("present", descriptors);
        addWord("timeless", descriptors);
        addWord("endless", descriptors);
        addWord("boundless", descriptors);
        addWord("limitless", descriptors);
        addWord("infinite", descriptors);
        addWord("mystic", descriptors);
        addWord("magic", descriptors);
        addWord("secret", descriptors);
        addWord("hidden", descriptors);
        addWord("sacred", descriptors);
        addWord("holy", descriptors);
        addWord("blessed", descriptors);
        addWord("cursed", descriptors);
        addWord("fabled", descriptors);
        addWord("legendary", descriptors);
        addWord("celestial", descriptors);
        addWord("terrestrial", descriptors);
        addWord("aquatic", descriptors);
        addWord("aerial", descriptors);
        addWord("ethereal", descriptors);
        addWord("astral", descriptors);
        addWord("cosmic", descriptors);
        addWord("planetary", descriptors);
        addWord("galactic", descriptors);
        addWord("universal", descriptors);

        // Add nouns
        addWord("dragon", nouns);
        addWord("phoenix", nouns);
        addWord("griffin", nouns);
        addWord("unicorn", nouns);
        addWord("pegasus", nouns);
        addWord("serpent", nouns);
        addWord("tiger", nouns);
        addWord("lion", nouns);
        addWord("eagle", nouns);
        addWord("wolf", nouns);
        addWord("bear", nouns);
        addWord("deer", nouns);
        addWord("fox", nouns);
        addWord("owl", nouns);
        addWord("hawk", nouns);
        addWord("swan", nouns);
        addWord("dove", nouns);
        addWord("raven", nouns);
        addWord("crane", nouns);
        addWord("falcon", nouns);
        addWord("star", nouns);
        addWord("moon", nouns);
        addWord("sun", nouns);
        addWord("earth", nouns);
        addWord("mars", nouns);
        addWord("jupiter", nouns);
        addWord("saturn", nouns);
        addWord("neptune", nouns);
        addWord("pluto", nouns);
        addWord("comet", nouns);
        addWord("ocean", nouns);
        addWord("river", nouns);
        addWord("lake", nouns);
        addWord("sea", nouns);
        addWord("bay", nouns);
        addWord("gulf", nouns);
        addWord("cove", nouns);
        addWord("port", nouns);
        addWord("harbor", nouns);
        addWord("shore", nouns);
        addWord("mountain", nouns);
        addWord("valley", nouns);
        addWord("forest", nouns);
        addWord("desert", nouns);
        addWord("plains", nouns);
        addWord("cave", nouns);
        addWord("cliff", nouns);
        addWord("peak", nouns);
        addWord("ridge", nouns);
        addWord("summit", nouns);
    }

    /// @notice Validates if a label follows the format adjective-descriptor-noun
    /// @param label The label to validate
    /// @param adjectives The list of valid adjectives
    /// @param descriptors The list of valid descriptors
    /// @param nouns The list of valid nouns
    /// @return bool True if the label is valid
    function isValidLabel(
        string memory label,
        WordList storage adjectives,
        WordList storage descriptors,
        WordList storage nouns
    ) public view returns (bool) {
        bytes memory labelBytes = bytes(label);
        uint256 length = labelBytes.length;

        // Find positions of hyphens
        uint256 firstHyphen = 0;
        uint256 secondHyphen = 0;
        bool foundFirst = false;
        bool foundSecond = false;

        for (uint256 i = 0; i < length; i++) {
            if (labelBytes[i] == "-") {
                if (!foundFirst) {
                    firstHyphen = i;
                    foundFirst = true;
                } else if (!foundSecond) {
                    secondHyphen = i;
                    foundSecond = true;
                } else {
                    return false; // Too many hyphens
                }
            }
        }

        if (!foundFirst || !foundSecond) {
            return false; // Not enough hyphens
        }

        // Extract parts
        string memory adjective = substring(label, 0, firstHyphen);
        string memory descriptor = substring(label, firstHyphen + 1, secondHyphen);
        string memory noun = substring(label, secondHyphen + 1, length);

        // Validate each part
        return isValidWord(adjective, adjectives) && isValidWord(descriptor, descriptors) && isValidWord(noun, nouns);
    }

    /// @notice Checks if a word exists in a word list using binary search
    /// @param word The word to check
    /// @param wordList The list of valid words
    /// @return bool True if the word is valid
    function isValidWord(string memory word, WordList storage wordList) internal view returns (bool) {
        bytes32 wordHash = keccak256(bytes(word));

        // Use linear search for simplicity and reliability
        for (uint256 i = 0; i < wordList.wordCount; i++) {
            if (wordList.wordHashes[i] == wordHash) {
                return true;
            }
        }

        return false;
    }

    /// @notice Adds a word to a word list
    /// @param word The word to add
    /// @param wordList The list to add the word to
    function addWord(string memory word, WordList storage wordList) public {
        bytes32 wordHash = keccak256(bytes(word));

        // Insert in sorted order for binary search
        uint256 insertPos = 0;
        while (insertPos < wordList.wordCount && wordList.wordHashes[insertPos] < wordHash) {
            insertPos++;
        }

        // Shift existing elements
        for (uint256 i = wordList.wordCount; i > insertPos; i--) {
            wordList.wordHashes[i] = wordList.wordHashes[i - 1];
        }

        wordList.wordHashes[insertPos] = wordHash;
        wordList.wordCount++;
    }

    /// @notice Extracts a substring from a string
    /// @param str The input string
    /// @param start The starting index
    /// @param end The ending index
    /// @return string The substring
    function substring(string memory str, uint256 start, uint256 end) private pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = strBytes[i];
        }
        return string(result);
    }
}
