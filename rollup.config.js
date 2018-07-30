import npm from 'rollup-plugin-npm';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';

export default {
    plugins: [
        resolve(),
        npm({
            browser: true,
            main: true,
            jsnext: true,
        }),
        babel({
            exclude :' node_modules / ** '
        })
    ]
}
