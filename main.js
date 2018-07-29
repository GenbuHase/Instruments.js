const ques = {};
const piano = new Instruments.Instrument();

window.addEventListener("keydown", event => {
	const noteInfo = Instruments.defaultMap[event.code];

	if (!noteInfo) return;
	const note = new Instruments.Note(piano, noteInfo[0], 5 + noteInfo[1]);

	event.preventDefault();

	if (!(note.toString() in ques)) {
		piano.play(note).then(noteId => ques[note.toString()] = noteId);
	}
});

window.addEventListener("keyup", event => {
	const noteInfo = Instruments.defaultMap[event.code];

	if (!noteInfo) return;
	const note = new Instruments.Note(piano, noteInfo[0], 5 + noteInfo[1]);

	event.preventDefault();

	if (note.toString() in ques) {
		const noteId = ques[note.toString()];

		piano.commander.requestCommand("Note.stop", [ noteId, 0 ],
			noteInfo => noteInfo.noteId === noteId && noteInfo.duration === 0
		).then(noteInfo => {
			piano.stop(noteInfo.noteId);
			delete ques[note.toString()];
		});
	}
});



/* global Instruments */