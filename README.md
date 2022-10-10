# web-zq1

A minimalist MIDI clock written in Node.js and with a web based frontend.

![web-zbase](https://github.com/zetof/web-zbase/blob/main/images/web-zbase.png)

Features:

- Sends MIDI clock as standard clock messages at a rate of pulses per seconds (PPQ)
- Ranges from 20 to 330 BPM
- Two available modes, `LIVE` (BPM changes are immediately sent) or `ONSEND` (changes are sent when chosen)
- PLAY / PAUSE button sends standard MIDI `continue` and `stop` messages
- REWIND button sends stzndard MIDI `start` message
- TAP button allows the user to tap the desired BPM