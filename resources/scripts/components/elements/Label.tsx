import styled from 'styled-components/macro';
import tw from 'twin.macro';

const Label = styled.label<{ isLight?: boolean }>`
    ${tw`block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2`};
    ${(props) => props.isLight && tw`text-zinc-700`};
`;

export default Label;
