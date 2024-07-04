const async_handler=(fn)=>async (req,res,next)=>{ //it is also written in ()=>{()=>{}}
    try {
        await fn(req,res,next)
    } catch (err) {
        res.status(err.code).json({
            success:false,
            message:err.message
        })
    }
}

export {async_handler}