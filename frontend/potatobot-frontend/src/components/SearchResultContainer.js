import React, {useEffect, useState} from 'react';
import {
    ChakraProvider,
    Box,
    Text,
    Link,
    Stack,
    Code,
    Grid,
    theme,
    Flex, Input, IconButton
} from '@chakra-ui/react';
import {MdSearch} from 'react-icons/md'
import SearchResult from "./SearchResult";
import {get_params} from "../utils.js"


export default function SearchResultContainer({searchResults, queue, setQueue}) {
    return (
        <Stack h="70vh" bg="#F2CC8F" overflowY="auto" p="3">
            {searchResults.map((searchResult, index) => {
                return <SearchResult id={index} videoId={searchResult.id} thumbnail={searchResult.thumbnail} title={searchResult.title}
                                     author={searchResult.author} queue={queue} setQueue={setQueue} />
            })}
        </Stack>
    );
}
