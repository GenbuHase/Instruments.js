const ques = {};
const piano = new Instruments.Instrument.Piano();

window.addEventListener("keydown", event => {
	const noteInfo = Instruments.defaultMap[event.code];

	if (!noteInfo) return;
	const note = piano.createNote(noteInfo[0], 5 + noteInfo[1]);

	event.preventDefault();

	if (!(note.toString() in ques)) {
		piano.play(note).then(noteIds => ques[note.toString()] = noteIds);
	}
});

window.addEventListener("keyup", event => {
	const noteInfo = Instruments.defaultMap[event.code];

	if (!noteInfo) return;
	const note = piano.createNote(noteInfo[0], 5 + noteInfo[1]);

	event.preventDefault();

	if (note.toString() in ques) {
		const noteIds = ques[note.toString()];

		for (const noteId of noteIds) {
			piano.commander.requestCommand("Note.stop", [ noteId, 0 ],
				noteInfo => noteInfo.noteId === noteId && noteInfo.duration === 0
			).then(noteInfo => {
				piano.stop(noteInfo.noteId);
				delete ques[note.toString()];
			});
		}
	}
});



/* global Instruments */