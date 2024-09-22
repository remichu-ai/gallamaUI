import create from 'zustand';

const useInputStore = create((set, get) => ({
    inputText: '',
    backupInputText: '',
    setInputText: (text) => set({inputText: text}),
    softClear: () => set((state) => ({
        backupInputText: state.inputText,
        inputText: ''
    })),
    revertInput: () => set((state) => ({
        inputText: state.backupInputText
    })),
    clear: () => set({
        inputText: '',
        backupInputText: ''
    }),
}));

export default useInputStore

//
// function ChatInput() {
//     const {inputText, setInputText} = useStore();
//
//     const handleSubmit = (e) => {
//         e.preventDefault();
//         // Handle submission logic here
//         setInputText('');
//     };
//
//     return (
//         <form onSubmit={handleSubmit}>
//             <input
//                 type="text"
//                 value={inputText}
//                 onChange={(e) => setInputText(e.target.value)}
//             />
//             <button type="submit">Send</button>
//         </form>
//     );
// }